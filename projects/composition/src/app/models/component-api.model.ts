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
