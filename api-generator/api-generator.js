const TypeDoc = require('typedoc');
const path = require('path');
const fs = require('fs');
const rootDir = path.resolve(__dirname, '../');
const outputPath = path.resolve(
  rootDir,
  'projects/composition/src/app/api-data/'
);

// Services aren't always documented on their own dedicated page — some are
// only ever embedded into a different component's page via the `[services]`
// input (e.g. CpsCronValidationService is only ever shown on /scheduler/api).
// Linking to `/<service-name>/api` in that case would 404, so only treat a
// service name as linkable if a matching top-level route actually exists.
const getKnownRoutes = () => {
  const routingFile = path.resolve(
    rootDir,
    'projects/composition/src/app/app-routing.module.ts'
  );
  try {
    const content = fs.readFileSync(routingFile, 'utf8');
    return new Set(
      [...content.matchAll(/pathMatcher\(\s*'([^']+)'\s*\)/g)].map((m) => m[1])
    );
  } catch (_) {
    return new Set();
  }
};
const knownRoutes = getKnownRoutes();

const staticMessages = {
  methods: "Defines methods that can be accessed by the component's reference.",
  emits:
    'Defines emit that determine the behavior of the component based on a given condition or report the actions that the component takes.',
  templates: 'Defines the templates used by the component.',
  events: "Defines the custom events used by the component's emitters.",
  interfaces: 'Defines the custom interfaces used by the component or service.',
  types: 'Defines the custom types used by the component or service.',
  props: 'Defines the input properties of the component.',
  service: 'Defines the service used by the component.',
  enums: 'Defines enums used by the component or service.',
  classes: 'Defines classes exposed by the component or service.',
  tokens: 'Injection tokens exposed by the component or service.'
};

async function main() {
  const app = await TypeDoc.Application.bootstrapWithPlugins({
    // typedoc options here
    name: 'cps-ui-kit',
    entryPoints: [
      `projects/cps-ui-kit/src/lib/components`,
      `projects/cps-ui-kit/src/lib/services`,
      `projects/cps-ui-kit/src/lib/directives`
    ],
    entryPointStrategy: 'expand',
    hideGenerator: true,
    excludeExternals: true,
    includeVersion: true,
    searchInComments: true,
    disableSources: false,
    logLevel: 'Error',
    sort: ['source-order'],
    exclude: [
      'node_modules',
      'projects/cps-ui-kit/src/lib/components/**/*cy.ts',
      'projects/cps-ui-kit/src/lib/components/**/*public_api.ts'
    ],
    tsconfig: 'tsconfig.generator.json'
  });

  const project = await app.convert();
  // await app.generateJson(project, `./api-generator/typedoc.json`);

  if (project) {
    const doc = {};
    const typesMap = {};

    const parseText = (content) => {
      if (content.kind === 'text') {
        return content.text.replace(/&#123;/g, '{').replace(/&#125;/g, '}');
      } else if (content.kind === 'code') {
        return content.text.replace(/^```ts\n/g, '').replace(/\n```$/g, '');
      }
    };

    const getDeprecatedText = (signature) => {
      const deprecatedTag = signature?.comment?.getTag('@deprecated');
      return deprecatedTag ? parseText(deprecatedTag.content[0]) : undefined;
    };

    const getDefaultValue = (signature) => {
      const defaultValueTag =
        signature?.comment?.getTag('@default') ??
        signature?.comment?.getTag('@defaultValue');
      return defaultValueTag
        ? parseText(defaultValueTag.content[0])
        : undefined;
    };

    const fileLineCache = {};
    const getSourceTypeAnnotation = (child, fallbackNode) => {
      const fallback = () =>
        child.type ? child.type.toString() : extractParameter(fallbackNode);
      const src = child.sources && child.sources[0];
      if (!src || !src.fullFileName) return fallback();
      try {
        if (!fileLineCache[src.fullFileName]) {
          fileLineCache[src.fullFileName] = fs
            .readFileSync(src.fullFileName, 'utf8')
            .split('\n');
        }
        const lines = fileLineCache[src.fullFileName];
        let collected = '';
        for (let i = src.line - 1; i < lines.length; i++) {
          collected += (collected ? ' ' : '') + lines[i].trim();
          if (/(?:=(?!>)|;)/.test(collected.replace(/<[^>]*>/g, ''))) break;
        }
        const escapedName = child.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = collected.match(
          new RegExp(
            `(?:readonly\\s+)?${escapedName}\\s*\\??\\s*:\\s*([\\s\\S]+?)(?=\\s*(?:;|=(?!>)|$))`
          )
        );
        if (!match) return fallback();
        const type = match[1]
          .replace(/\s*\|\s*/g, ' | ')
          .trim()
          .replace(/^\|\s*/, '')
          .replace(/\bArray<([^>]+)>/g, '$1[]')
          .trim();
        return type || fallback();
      } catch (_) {
        return fallback();
      }
    };
    const getInputAlias = (prop) => {
      const src = prop.sources && prop.sources[0];
      if (!src || !src.fullFileName) return null;
      try {
        if (!fileLineCache[src.fullFileName]) {
          fileLineCache[src.fullFileName] = fs
            .readFileSync(src.fullFileName, 'utf8')
            .split('\n');
        }
        const lines = fileLineCache[src.fullFileName];
        const lineIdx = src.line - 1;
        for (let i = Math.max(0, lineIdx - 2); i <= lineIdx; i++) {
          const line = lines[i] || '';
          const signalAlias = line.match(/alias:\s*['"]([^'"]+)['"]/);
          if (signalAlias) return signalAlias[1];
          const inputAlias = line.match(/@Input\s*\(\s*['"]([^'"]+)['"]\s*\)/);
          if (inputAlias) return inputAlias[1];
        }
      } catch (_) {
        // ignore unreadable files
      }
      return null;
    };

    const modules = project.groups.find((g) => g.title === 'Modules');

    if (isProcessable(modules)) {
      modules.children.forEach((module) => {
        // const name = module.name.replace(/\/.*/, '');

        // Regex to get only relevant directory, e.g. from
        // components/cps-autocomplete/cps-autocomplete.component get only cps-autocomplete
        const name = module.name.match(/\/(.*?)(\/|$)/)[1];

        if (allowed(name)) {
          if (module.groups) {
            if (!doc[name]) {
              doc[name] = {
                components: {}
              };
            }
            const module_components_group = module.groups.find(
              (g) => g.title === 'Components'
            );
            const module_events_group = module.groups.find(
              (g) => g.title === 'Events'
            );
            const module_templates_group = module.groups.find(
              (g) => g.title === 'Templates'
            );
            const module_interface_group = module.groups.find(
              (g) => g.title === 'Interface'
            );
            const module_service_group = module.groups.find(
              (g) => g.title === 'Services'
            );
            const module_types_group = module.groups.find(
              (g) => g.title === 'Types'
            );
            const module_enums_group = module.groups.find(
              (g) => g.title === 'Enums'
            );
            const module_classes_group = module.groups.find(
              (g) => g.title === 'Classes'
            );
            const module_tokens_group = module.groups.find(
              (g) => g.title === 'Tokens'
            );
            // Todo: Add support for type aliases

            if (isProcessable(module_components_group)) {
              module_components_group.children.forEach((component) => {
                const componentName = component.name;
                const comment = component.comment;

                doc[name].components[componentName] = {
                  description:
                    comment &&
                    comment.summary.map((s) => s.text || '').join(' ')
                };
                typesMap[componentName] = name.replace('cps-', '');

                const component_props_group = component.groups.find(
                  (g) => g.title === 'Props'
                );

                if (isProcessable(component_props_group)) {
                  const props = {
                    description: staticMessages.props,
                    values: []
                  };

                  component_props_group.children.forEach((prop) => {
                    const typedocType =
                      (prop.getSignature?.type ?? prop.type)?.toString() ??
                      null;
                    const resolvedType =
                      !prop.getSignature &&
                      !typedocType?.startsWith('InputSignal<')
                        ? getSourceTypeAnnotation(prop, null)
                        : typedocType;
                    props.values.push({
                      name: getInputAlias(prop) ?? prop.name,
                      optional: prop.flags.isOptional,
                      readonly: prop.flags.isReadonly,
                      type: unwrapSignalType(resolvedType),
                      default:
                        getDefaultValue(prop.setSignature) ??
                        getDefaultValue(prop.getSignature) ??
                        getDefaultValue(prop) ??
                        (prop.type &&
                        prop.type.name === 'boolean' &&
                        !prop.defaultValue
                          ? 'false'
                          : prop.defaultValue &&
                              !(
                                typedocType?.startsWith('InputSignal<') &&
                                prop.defaultValue === '...'
                              )
                            ? prop.defaultValue.replace(/^'|'$/g, '')
                            : undefined),
                      description: (
                        prop.getSignature?.comment?.summary ||
                        prop.setSignature?.comment?.summary ||
                        prop.comment?.summary
                      )
                        ?.map((s) => s.text || '')
                        .join(' '),
                      deprecated:
                        getDeprecatedText(prop.getSignature) ||
                        getDeprecatedText(prop.setSignature) ||
                        getDeprecatedText(prop.comment)
                    });
                  });
                  doc[name].components[componentName].props = props;
                }

                const component_emits_group = component.groups.find(
                  (g) => g.title === 'Emits'
                );
                if (isProcessable(component_emits_group)) {
                  const emits = {
                    description: staticMessages.emits,
                    values: []
                  };

                  component_emits_group.children.forEach((emitter) => {
                    emits.values.push({
                      name: emitter.name,
                      parameters: [
                        {
                          name:
                            extractParameter(emitter) &&
                            extractParameter(emitter).includes('Event')
                              ? 'event'
                              : 'value',
                          type: extractParameter(emitter)
                        }
                      ],
                      description:
                        emitter.comment &&
                        emitter.comment.summary
                          .map((s) => s.text || '')
                          .join(' '),
                      deprecated: getDeprecatedText(emitter)
                    });
                  });

                  doc[name].components[componentName].emits = emits;
                }

                const component_methods_group = component.groups.find(
                  (g) => g.title === 'Method'
                );
                if (isProcessable(component_methods_group)) {
                  const methods = {
                    description: staticMessages.methods,
                    values: []
                  };

                  component_methods_group.children.forEach((method) => {
                    const signature = method.getAllSignatures()[0];
                    methods.values.push({
                      name: signature.name,
                      parameters: signature.parameters.map((param) => {
                        return {
                          name: param.name,
                          type: param.type.toString(),
                          description:
                            param.comment &&
                            param.comment.summary
                              .map((s) => s.text || '')
                              .join(' ')
                        };
                      }),
                      description:
                        signature.comment &&
                        signature.comment.summary
                          .map((s) => s.text || '')
                          .join(' ')
                    });
                  });

                  doc[name].components[componentName].methods = methods;
                }

                const component_events_group = component.groups.find(
                  (g) => g.title === 'Events'
                );
                if (isProcessable(component_events_group)) {
                  const events = {
                    description: staticMessages.events,
                    values: []
                  };

                  component_events_group.children.forEach((event) => {
                    events.values.push({
                      name: event.name,
                      description:
                        event.comment &&
                        event.comment.summary
                          .map((s) => s.text || '')
                          .join(' '),
                      props:
                        event.children &&
                        event.children.map((child) => ({
                          name: child.name,
                          optional: child.flags.isOptional,
                          readonly: child.flags.isReadonly,
                          type: child.type && child.type.toString(),
                          description:
                            child.comment &&
                            child.comment.summary
                              .map((s) => s.text || '')
                              .join(' '),
                          deprecated: getDeprecatedText(child)
                        }))
                    });
                  });

                  doc[name].components[componentName].events = events;
                }
              });
            }

            if (isProcessable(module_events_group)) {
              const events = {
                description: staticMessages.events,
                values: []
              };

              module_events_group.children.forEach((event) => {
                events.values.push({
                  name: event.name,
                  description:
                    event.comment &&
                    event.comment.summary.map((s) => s.text || '').join(' '),
                  props:
                    event.children &&
                    event.children.map((child) => ({
                      name: child.name,
                      optional: child.flags.isOptional,
                      readonly: child.flags.isReadonly,
                      type: child.type && child.type.toString(),
                      description:
                        child.comment &&
                        child.comment.summary
                          .map((s) => s.text || '')
                          .join(' '),
                      deprecated: getDeprecatedText(child)
                    }))
                });
              });

              doc[name].events = events;
            }

            if (isProcessable(module_templates_group)) {
              const templates = {
                description: staticMessages.templates,
                values: []
              };

              module_templates_group.children.forEach((template) => {
                const parent = template.parent.name.split(/[^a-zA-Z]+/)[1];
                template.children.forEach((child) => {
                  const signature = child.getAllSignatures()[0];
                  templates.values.push({
                    parent,
                    name: signature ? signature.name : child.name,
                    parameters: signature.parameters.map((param) => {
                      let type = param.type.toString();

                      if (param.type.declaration) {
                        type = '';

                        if (param.type.declaration.children) {
                          param.type.declaration.children.forEach((child) => {
                            if (child.signatures) {
                              const childSignature = child.signatures[0];
                              const parameters =
                                childSignature.parameters.reduce(
                                  (acc, { name, type }, index) =>
                                    index === 0
                                      ? `${name}: ${type.name}`
                                      : `${acc}, ${name}: ${type.name}`,
                                  ''
                                );
                              type += ` \t ${childSignature.name}(${parameters}): ${childSignature.type?.name}, // ${childSignature.comment?.summary[0]?.text}\n `;
                            } else {
                              const childType = child.type.elementType
                                ? child.type.elementType.name
                                : child.type.name;

                              type += ` \t ${child.name}: ${childType}, // ${child.comment?.summary[0]?.text}\n `;
                            }
                          });
                        }

                        type = `{\n ${type} }`;
                      }

                      return {
                        name: param.name,
                        type,
                        description:
                          param.comment &&
                          param.comment.summary
                            .map((s) => s.text || '')
                            .join(' ')
                      };
                    }),
                    description:
                      signature.comment &&
                      signature.comment.summary
                        .map((s) => s.text || '')
                        .join(' '),
                    deprecated: getDeprecatedText(signature)
                  });
                });
              });

              doc[name].templates = templates;
            }

            if (isProcessable(module_service_group)) {
              doc[name] = {
                ...doc[name]
                // description: staticMessages['service']
              };

              module_service_group.children.forEach((service) => {
                doc[name] = {
                  ...doc[name],
                  name: service.name,
                  description:
                    service.comment &&
                    service.comment.summary.map((s) => s.text || '').join(' ')
                };
                const serviceSlug = name.replace('cps-', '');
                if (knownRoutes.has(serviceSlug)) {
                  typesMap[service.name] = serviceSlug;
                }
                const service_methods_group = service.groups.find(
                  (g) => g.title === 'Method'
                );
                if (isProcessable(service_methods_group)) {
                  const methods = {
                    description: 'Methods used in the service.',
                    values: []
                  };

                  service_methods_group.children.forEach((method) => {
                    const signature = method.getAllSignatures()[0];
                    methods.values.push({
                      name: signature.name,
                      parameters: signature.parameters.map((param) => {
                        return {
                          name: param.name,
                          type: param.type.toString(),
                          description:
                            param.comment &&
                            param.comment.summary
                              .map((s) => s.text || '')
                              .join(' '),
                          defaultValue: param.defaultValue
                        };
                      }),
                      returnType: signature.type.toString(),
                      description:
                        signature.comment &&
                        signature.comment.summary
                          .map((s) => s.text || '')
                          .join(' ')
                    });
                  });

                  doc[name].methods = methods;
                }
              });
            }

            if (isProcessable(module_tokens_group)) {
              const tokens = {
                description: staticMessages.tokens,
                values: []
              };

              module_tokens_group.children.forEach((token) => {
                tokens.values.push({
                  name: token.name,
                  type: token.type ? token.type.toString() : 'InjectionToken',
                  description:
                    token.comment &&
                    token.comment.summary.map((s) => s.text || '').join(' ')
                });
              });

              doc[name].tokens = tokens;
            }

            if (isProcessable(module_interface_group)) {
              const interfaces = {
                description: staticMessages.interfaces,
                values: []
              };

              module_interface_group.children.forEach((int) => {
                interfaces.values.push({
                  name: int.name,
                  description:
                    int.comment &&
                    int.comment.summary.map((s) => s.text || '').join(' '),
                  props:
                    int.children &&
                    int.children
                      .filter(
                        (child) =>
                          child.kindString !== 'Constructor' &&
                          child.name !== 'constructor'
                      )
                      .map((child) => {
                        const sig = child.signatures && child.signatures[0];
                        let type;
                        if (sig) {
                          const params = (sig.parameters ?? [])
                            .map(
                              (p) =>
                                `${p.name}${p.flags?.isOptional ? '?' : ''}: ${p.type?.toString() ?? 'unknown'}`
                            )
                            .join(', ');
                          type = `(${params}) => ${sig.type?.toString() ?? 'void'}`;
                        } else {
                          type = getSourceTypeAnnotation(child, int);
                        }
                        return {
                          name: child.name,
                          optional: child.flags.isOptional,
                          readonly: child.flags.isReadonly,
                          type,
                          default:
                            (child.defaultValue
                              ? child.defaultValue.replace(/^'|'$/g, '')
                              : undefined) ?? getDefaultValue(child),
                          description: (
                            sig?.comment?.summary || child.comment?.summary
                          )
                            ?.map((s) => s.text || '')
                            .join(' '),
                          deprecated:
                            getDeprecatedText(sig) || getDeprecatedText(child)
                        };
                      })
                });
                typesMap[int.name] = name.replace('cps-', '');
              });

              if (doc[name]?.interfaces) {
                doc[name].interfaces = {
                  ...doc[name].interfaces,
                  values: [...doc[name].interfaces.values, ...interfaces.values]
                };
              } else {
                doc[name].interfaces = interfaces;
              }
            }

            if (isProcessable(module_types_group)) {
              const types = {
                description: staticMessages.types,
                values: []
              };

              module_types_group.children.forEach((t) => {
                types.values.push({
                  name: t.name,
                  value: getTypesValue(t, project),
                  description:
                    t.comment.summary &&
                    t.comment.summary.map((s) => s.text || '').join(' ')
                });
                typesMap[t.name] = name.replace('cps-', '');
              });

              if (doc[name]?.types) {
                doc[name].types = {
                  ...doc[name].types,
                  values: [...doc[name].types.values, ...types.values]
                };
              } else {
                doc[name].types = types;
              }
            }

            if (isProcessable(module_enums_group)) {
              const enums = {
                description: staticMessages.enums,
                values: []
              };

              module_enums_group.children.forEach((e) => {
                enums.values.push({
                  name: e.name,
                  description:
                    e.comment.summary &&
                    e.comment.summary.map((s) => s.text || '').join(' '),
                  values: e.children.map((value) => ({
                    name: value.escapedName,
                    value: value.type.value
                  }))
                });
                typesMap[e.name] = name.replace('cps-', '');
              });

              if (doc[name]?.enums) {
                doc[name].enums = {
                  ...doc[name].enums,
                  values: [...doc[name].enums.values, ...enums.values]
                };
              } else {
                doc[name].enums = enums;
              }
            }

            if (isProcessable(module_classes_group)) {
              const classes = {
                description: staticMessages.classes,
                values: []
              };

              module_classes_group.children
                .filter((cls) =>
                  cls.comment?.blockTags?.some(
                    (tag) =>
                      tag.tag === '@group' &&
                      tag.content?.some((c) => c.text?.trim() === 'Classes')
                  )
                )
                .forEach((cls) => {
                  const classEntry = {
                    name: cls.name,
                    description:
                      cls.comment &&
                      cls.comment.summary.map((s) => s.text || '').join(' ')
                  };

                  const cls_props_group = cls.groups?.find(
                    (g) => g.title === 'Props'
                  );
                  if (isProcessable(cls_props_group)) {
                    classEntry.props = cls_props_group.children.map((prop) => ({
                      name: prop.name,
                      optional: prop.flags.isOptional,
                      readonly: prop.flags.isReadonly,
                      type: prop.type ? prop.type.toString() : null,
                      default:
                        (prop.defaultValue
                          ? prop.defaultValue.replace(/^'|'$/g, '')
                          : undefined) ?? getDefaultValue(prop),
                      description:
                        prop.comment &&
                        prop.comment.summary.map((s) => s.text || '').join(' '),
                      deprecated: getDeprecatedText(prop)
                    }));
                  }

                  const cls_methods_group = cls.groups?.find(
                    (g) => g.title === 'Method'
                  );
                  if (isProcessable(cls_methods_group)) {
                    classEntry.methods = cls_methods_group.children.map(
                      (method) => {
                        const signature = method.getAllSignatures()[0];
                        return {
                          name: signature.name,
                          parameters: signature.parameters.map((param) => ({
                            name: param.name,
                            type: param.type.toString(),
                            description:
                              param.comment &&
                              param.comment.summary
                                .map((s) => s.text || '')
                                .join(' ')
                          })),
                          returnType: signature.type.toString(),
                          description:
                            signature.comment &&
                            signature.comment.summary
                              .map((s) => s.text || '')
                              .join(' ')
                        };
                      }
                    );
                  }

                  const cls_events_group = cls.groups?.find(
                    (g) => g.title === 'Events'
                  );
                  if (isProcessable(cls_events_group)) {
                    classEntry.events = cls_events_group.children.map(
                      (event) => ({
                        name: event.name,
                        type: event.type ? event.type.toString() : null,
                        description:
                          event.comment &&
                          event.comment.summary
                            .map((s) => s.text || '')
                            .join(' '),
                        deprecated: getDeprecatedText(event)
                      })
                    );
                  }

                  classes.values.push(classEntry);
                  typesMap[cls.name] = name.replace('cps-', '');
                });

              if (classes.values.length > 0) {
                if (doc[name]?.classes) {
                  doc[name].classes = {
                    ...doc[name].classes,
                    values: [...doc[name].classes.values, ...classes.values]
                  };
                } else {
                  doc[name].classes = classes;
                }
              }
            }
          }
        }
      });
    }

    const mergedDocs = {};

    for (const key in doc) {
      if (key.includes('.interface')) {
        const parentKey = key.split('.')[0];
        const interfaceDoc = doc[key];
        if (!mergedDocs[parentKey]) {
          mergedDocs[parentKey] = {
            ...doc[parentKey],
            interfaces: {
              ...interfaceDoc
            }
          };
        }
      } else {
        if (!mergedDocs[key]) {
          mergedDocs[key] = {
            ...doc[key]
          };
        }
      }
    }

    for (const key in mergedDocs) {
      const doc = mergedDocs[key];
      const isEmpty =
        Object.keys(doc).length === 1 &&
        doc.components &&
        Object.keys(doc.components).length === 0;
      if (isEmpty) continue;
      const typedocJSON = JSON.stringify(doc, null, 4);
      !fs.existsSync(outputPath) && fs.mkdirSync(outputPath);
      fs.writeFileSync(path.resolve(outputPath, `${key}.json`), typedocJSON);
    }

    if (Object.entries(typesMap).length) {
      const typesMapJSON = JSON.stringify(typesMap, null, 4);
      !fs.existsSync(outputPath) && fs.mkdirSync(outputPath);
      fs.writeFileSync(
        path.resolve(outputPath, `types_map.json`),
        typesMapJSON
      );
    }

    // const typedocJSON = JSON.stringify(mergedDocs, null, 4);
    // !fs.existsSync(outputPath) && fs.mkdirSync(outputPath);
    // fs.writeFileSync(path.resolve(outputPath, 'index.json'), typedocJSON);
  }
}

function extractParameter(emitter) {
  const { comment, type } = emitter;

  if (type && type.typeArguments) {
    if (type.toString()) {
      return type.toString().replace(/^.*?<([^>]*)>.*$/, '$1');
    } else {
      if (!type.typeArguments[0].types && !type.typeArguments[0].type) {
        return type.typeArguments.map((el) => ({
          name: el.name.includes('Event') ? 'event' : 'value',
          type: el.name.replace(/[^a-zA-Z]/g, '')
        }));
      }

      if (type.typeArguments[0].types) {
        return type.typeArguments[0].types.map((el) => {
          if (el.type && el.type === 'array') {
            return { name: 'value', type: el.elementType.name + '[]' };
          } else {
            return {
              name: el.name.includes('Event') ? 'event' : 'value',
              type: el.name.replace(/[^a-zA-Z]/g, '')
            };
          }
        });
      }
    }
  }
}

const unwrapSignalType = (type) => {
  if (!type) return type;
  const match = type.match(/^InputSignal<(.+)>$/);
  return match ? match[1] : type;
};

const isProcessable = (value) => {
  return value && value.children && value.children.length;
};

const allowed = (name) => {
  return (
    !name.includes('ts-helpers') &&
    !name.includes('icons') &&
    !name.includes('cps-theme')
  );
};

// Handle `typeof SomeArray[number]` — parse the source file and expand string literals to a union.
// Returns null if `t` isn't that shape, or the source array couldn't be resolved.
const expandIndexedAccessArray = (t, project) => {
  if (
    t?.type !== 'indexedAccess' ||
    t.objectType?.type !== 'query' ||
    t.indexType?.type !== 'intrinsic' ||
    t.indexType?.name !== 'number'
  ) {
    return null;
  }

  const refName = t.objectType.queryType?.name;
  const variable = refName
    ? project
        ?.getReflectionsByKind(TypeDoc.ReflectionKind.Variable)
        ?.find((r) => r.name === refName)
    : null;
  const sourceFile = variable?.sources?.[0]?.fullFileName;
  if (!sourceFile) return null;

  try {
    const src = fs.readFileSync(sourceFile, 'utf-8');
    const arrayMatch = src.match(
      new RegExp(
        `(?:export\\s+)?const\\s+${refName}\\s*=\\s*\\[([\\s\\S]*?)\\]`,
        'm'
      )
    );
    if (arrayMatch) {
      const items = [...arrayMatch[1].matchAll(/'([^']+)'/g)].map(
        (m) => `'${m[1]}'`
      );
      if (items.length) return items.join(' | ');
    }
  } catch (_) {}

  return null;
};

const getTypesValue = (typeobj, project) => {
  const { type, children, indexSignature } = typeobj ?? {};

  // 1) Handle `typeof SomeArray[number]`, whether it's the whole type or a member of a
  // top-level union (e.g. `typeof SomeArray[number] | ''`) — expand just that member.
  if (type?.type === 'indexedAccess') {
    const expanded = expandIndexedAccessArray(type, project);
    if (expanded) return expanded;
  } else if (
    type?.type === 'union' &&
    type.types?.some((member) => member.type === 'indexedAccess')
  ) {
    return type.types
      .map((member) => expandIndexedAccessArray(member, project) ?? `${member}`)
      .join(' | ');
  }

  // 2) Handle index signatures (e.g., { [key: string]: number })
  // If the type has an index signature, extract the key and value types.
  // Example: { [key: string]: number } -> { "[key:string]": "number" }
  if (indexSignature) {
    const signature = typeobj.getAllSignatures?.()?.[0];
    if (signature) {
      const param = signature.parameters?.[0];
      const idx = param
        ? `[${param.name}:${param.type?.toString?.()}]`
        : '[key:unknown]';
      return JSON.stringify({ [idx]: signature.type?.toString?.() }, null, 0);
    }
  }

  // 3) Handle object-literal type aliases (NEWER TypeDoc behavior)
  // Some object-literal type aliases have their properties directly in the `children` array.
  // Example: { name: string; age: number } -> { "name": "string", "age": "number" }
  if (Array.isArray(children) && children.length) {
    const entries = children.map((ch) => ({
      [ch.flags?.isOptional ? ch.name + '?' : ch.name]:
        ch.type?.toString?.() ?? 'unknown'
    }));
    return JSON.stringify(Object.assign({}, ...entries), null, 4);
  }

  // 4) Handle object-literal type aliases under reflection (OLDER TypeDoc behavior)
  // Older versions of TypeDoc store object-literal properties under `type.declaration.children`.
  // Example: { name: string; age: number } -> { "name": "string", "age": "number" }
  if (type?.type === 'reflection' && type.declaration?.children?.length) {
    const entries = type.declaration.children.map((ch) => ({
      [ch.flags?.isOptional ? ch.name + '?' : ch.name]:
        ch.type?.toString?.() ?? 'unknown'
    }));
    return JSON.stringify(Object.assign({}, ...entries), null, 4);
  }

  // 5) Handle function type aliases
  // If the type is a function alias, serialize its signature.
  // Example: (name: string, age: number) => boolean
  if (type?.type === 'reflection' && type.declaration?.signatures?.length) {
    const sig = type.declaration.signatures[0];
    const params = (sig.parameters ?? [])
      .map((p) => `${p.name}: ${p.type?.toString?.() ?? 'unknown'}`)
      .join(', ');
    const ret = sig.type?.toString?.() ?? 'void';
    return `(${params}) => ${ret}`;
  }

  return type?.toString?.();
};

main().catch(console.error);
