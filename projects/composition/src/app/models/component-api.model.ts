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
  // TODO: investigate why there is no description for setters props
  description?: string;
  name: string;
  optional: boolean;
  readonly: boolean;
  type: string;
}
