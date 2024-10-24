import { z } from 'zod';
import { type ClientSchema } from '../../../../../client/src/index';
import { Schema as S } from '../../../../src';

import { SuperSchema } from '../../../../src/schema/super-schema/SuperSchema';
import {
  schemaComplexZodValid,
  schemaComplexZodWithUnknowns,
  schemaFlatZodValid,
  schemaFlatZodValid_noId,
  schemaFlatZodValid_wrongId,
} from './collection/zod-example-super-schema-collection';

export const superSchemaFlatZodValid_noId: SuperSchema = {
  version: 0.1,

  collections: {
    exampleCollection: schemaFlatZodValid_noId,
  },
};
export const superSchemaFlatZodValid_wrongId: SuperSchema = {
  version: 0.1,

  collections: {
    exampleCollection: schemaFlatZodValid_wrongId,
  },
};
export const superSchemaFlatZodValid_NoRoles: SuperSchema = {
  version: 0.1,

  collections: {
    exampleCollection: schemaFlatZodValid,
  },
};

export const superSchemaFlatZodValid: SuperSchema = {
  version: 0.1,

  roles: {
    user: {
      match: {
        sub: '$userId',
      },
    },
  },

  collections: {
    exampleCollection: schemaFlatZodValid,
  },
};

export const superSchemaComplexZodValid: SuperSchema = {
  version: 0.1,

  roles: {
    user: {
      match: {
        sub: '$userId',
      },
    },
  },

  collections: {
    exampleCollection: schemaComplexZodValid,
  },
};

export const superSchemaComplexZodValidWithUnknowns: SuperSchema = {
  version: 0.1,

  roles: {
    user: {
      match: {
        sub: '$userId',
      },
    },
  },

  collections: {
    exampleCollection: schemaComplexZodWithUnknowns,
  },
};
