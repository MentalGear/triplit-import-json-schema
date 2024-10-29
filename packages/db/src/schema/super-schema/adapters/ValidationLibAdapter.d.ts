const keys = [
  'String',
  'Number',
  'Boolean',
  'Date',
  'Nullable',
  'Set',
  'Record',
  'Optional',
  // 'Object', Do not define here, since it has it own wrapInContainer function
] as const;
type DbTypesList = (typeof keys)[number];

/**
 * Description
 * @param corrections pair of corrections to valicationschema and json schema.
 * @param typMapping map database types to validation types
 * @param idMapping Triplit only allows nanoid for the moment
 * only use if the schema needs modifications for proper json output, but this could also be done in toJsonSchema !
 **/

export interface ValidationLibAdapter {
  typeMapping: Record<DbTypesList, any>;
  wrapInContainer: (obj: any) => any;
  isOwnContainer: (obj: any) => boolean;
  isOwnType: (obj: any) => boolean;
  isDefaultRandom: (obj: any) => boolean;
  generateStringType: (
    defaultFunc: () => string,
    validationFunc: () => boolean
  ) => any;
  jsonSchemaFrom: (obj: any) => JSONSchema7;

  // isStringType: (obj: any) => boolean;
  // isNullable: (obj: any) => boolean;
  // setDefaultFunction: (obj: any, defaultFunc: () => string) => any;
  // setCustomValidationFunction: (obj: any, validationFunc: () => boolean) => any;
  // corrections?: ValidationCorrection[];
  // idMapping: {
  // not needed anymore, since triplit allows any string as id
  //  https://www.triplit.dev/docs/schemas#id
  //   nanoid: () => any;
  // };
}

export interface ValidationCorrection {
  purpose: string;
  validationSchema: (obj: any) => any;
  jsonSchema: (obj: any) => any;
}

export type TypeMappingValues =
  ValidationLibAdapter['typeMapping'][DbTypesList];
