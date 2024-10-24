import { QueryAttributeDefinition, CollectionRules } from 'packages/db/src';
import {
  SchemaConfig,
  RolePermissions,
  Roles,
} from 'packages/db/src/schema/types';

import { ValidationLibAdapter } from './adapters/ValidationLibAdapter';

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

enum keyPossibilities {
  string,
  'id',
}

export type SuperSchemaCollection<T extends SchemaConfig = SchemaConfig> = {
  // TODO: add to require at least id field ?
  schema: {
    [key in keyPossibilities]: ValidationLibTypes | QueryAttributeDefinition;
  };
  // TODO: possible to not use <any, any> here?
  /**
   * @deprecated use `permissions` instead
   */
  rules?: CollectionRules<any, any>;
  permissions?: RolePermissions<any, any>;
};
