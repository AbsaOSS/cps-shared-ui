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

export interface ServiceAPI {
  name: string;
  description: string;
  methods: {
    description: string;
    values: MethodAPI[];
  };
}
