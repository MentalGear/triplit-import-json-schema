import { QueryAttributeDefinition, CollectionRules } from 'packages/db/src';
import {
  SchemaConfig,
  RolePermissions,
  Roles,
} from 'packages/db/src/schema/types';

import { ValidationLibAdapter } from './adapters/ValidationLibAdapter';
import { acceptedCustomIdValues } from './process-super-schema.ts';

// FIXME: get correct types
type ValidationLibTypes =
  ValidationLibAdapter['typMapping'][keyof ValidationLibAdapter['typMapping']];

export type SuperSchema = {
  version?: number;
  collections: {
    [collection: string]: SuperSchemaCollection;
  };
  roles?: Roles;
};

const specialIdValues = typeof acceptedCustomIdValues;

// enum keyPossibilities { // Removed enum
//   string,
//   'id',
// }

export type SuperSchemaCollection<T extends SchemaConfig = SchemaConfig> = {
  schema: {
    id: ValidationLibTypes | QueryAttributeDefinition | specialIdValues; // 'id' is now required
    [key: string]: ValidationLibTypes | QueryAttributeDefinition; // other keys are optional
  };
  // TODO: possible to not use <any, any> here?
  /**
   * @deprecated use `permissions` instead
   */
  rules?: CollectionRules<any, any>;
  permissions?: RolePermissions<any, any>;
};
