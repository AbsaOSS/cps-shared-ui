export interface EmitAPI {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
  }[];
}

export interface PropAPI {
  default?: string;
  description?: string;
  name: string;
  optional: boolean;
  readonly: boolean;
  type: string;
}

export interface ComponentAPI {
  description: string;
  emits?: {
    description: string;
    values: EmitAPI[];
  };
  props: {
    description: string;
    values: PropAPI[];
  };
}

export interface TypesAPI {
  description: string;
  values: {
    name: string;
    description: string;
    value?: string;
  }[];
}

export interface InterfaceAPI {
  description: string;
  values: {
    name: string;
    description: string;
    value?: string;
    props?: PropAPI[];
  }[];
}

interface EnumAPI {
  name: string;
  description: string;
  values: {
    name: string;
    value: string | number;
  }[];
}

export interface EnumsAPI {
  description: string;
  values: EnumAPI[];
}

export interface ClassPropAPI {
  name: string;
  optional: boolean;
  readonly: boolean;
  type: string;
  default?: string;
  description?: string;
  deprecated?: string;
}

export interface ClassMethodAPI {
  name: string;
  parameters: { name: string; type: string; description?: string }[];
  returnType: string;
  description?: string;
}

export interface ClassEventAPI {
  name: string;
  type: string;
  description?: string;
  deprecated?: string;
}

export interface ClassAPI {
  name: string;
  description?: string;
  props?: ClassPropAPI[];
  methods?: ClassMethodAPI[];
  events?: ClassEventAPI[];
}

export interface ClassesAPI {
  description: string;
  values: ClassAPI[];
}
