import {
  ClassesAPI,
  EnumsAPI,
  InterfaceAPI,
  TypesAPI
} from './component-api.model';

export interface MethodAPI {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description?: string;
  }[];
  returnType: string;
}

export interface TokenAPI {
  name: string;
  type: string;
  description: string;
}

export interface TokensAPI {
  description: string;
  values: TokenAPI[];
}

export interface ServiceAPI {
  name: string;
  description: string;
  methods: {
    description: string;
    values: MethodAPI[];
  };
  tokens?: TokensAPI;
  types?: TypesAPI;
  interfaces?: InterfaceAPI;
  classes?: ClassesAPI;
  enums?: EnumsAPI;
}
