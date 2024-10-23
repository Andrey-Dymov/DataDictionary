export interface Field {
  name: string;
  type: string;
  inputType: string;
  displayType: string;
  prompt: string;
  req?: boolean;
}

export interface Relation {
  type: string;
  target: string;
  foreignKey: string;
}

export interface Collection {
  name: string;
  description: string;
  icon: string;
  prompt: string;
  promptSingle: string;
  fields: Field[];
  relations: Record<string, Relation>;
}