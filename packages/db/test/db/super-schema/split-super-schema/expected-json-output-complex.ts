export const expectedJsonOutputComplex = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      // pattern: '^[a-zA-Z0-9_-]{21}$',
    },
    boolean: {
      type: 'boolean',
    },
    number: {
      type: 'number',
    },
    string: {
      type: 'string',
    },
    stringDefault: {
      type: 'string',
      default: 'default string',
    },
    stringEnum: {
      type: 'string',
      enum: ['1', '2'],
    },
    date: {
      type: 'string',
      format: 'date-time',
    },
    setString: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
      },
    },
    setNumber: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'number',
      },
    },
    setBoolean: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'boolean',
      },
    },
    setDate: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        format: 'date-time',
      },
    },
    setStringEnum: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        enum: ['a', 'b'],
      },
    },
    level_2: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          // pattern: '^[a-zA-Z0-9_-]{21}$',
        },
        boolean: {
          type: 'boolean',
        },
        number: {
          type: 'number',
        },
        string: {
          type: 'string',
        },
        stringDefault: {
          type: 'string',
          default: 'default string',
        },
        stringEnum: {
          type: 'string',
          enum: ['1', '2'],
        },
        date: {
          type: 'string',
          format: 'date-time',
        },
        setString: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
          },
        },
        setNumber: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'number',
          },
        },
        setBoolean: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'boolean',
          },
        },
        setDate: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            format: 'date-time',
          },
        },
        setStringEnum: {
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            enum: ['a', 'b'],
          },
        },
        level_3: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              // pattern: '^[a-zA-Z0-9_-]{21}$',
            },
            boolean: {
              type: 'boolean',
            },
            number: {
              type: 'number',
            },
            string: {
              type: 'string',
            },
            stringDefault: {
              type: 'string',
              default: 'default string',
            },
            stringEnum: {
              type: 'string',
              enum: ['1', '2'],
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
            setString: {
              type: 'array',
              uniqueItems: true,
              items: {
                type: 'string',
              },
            },
            setNumber: {
              type: 'array',
              uniqueItems: true,
              items: {
                type: 'number',
              },
            },
            setBoolean: {
              type: 'array',
              uniqueItems: true,
              items: {
                type: 'boolean',
              },
            },
            setDate: {
              type: 'array',
              uniqueItems: true,
              items: {
                type: 'string',
                format: 'date-time',
              },
            },
            setStringEnum: {
              type: 'array',
              uniqueItems: true,
              items: {
                type: 'string',
                enum: ['a', 'b'],
              },
            },
          },
          required: [
            'boolean',
            'number',
            'string',
            'stringEnum',
            'date',
            'setString',
            'setNumber',
            'setBoolean',
            'setDate',
            'setStringEnum',
          ],
          additionalProperties: false,
        },
      },
      required: [
        'boolean',
        'number',
        'string',
        'stringEnum',
        'date',
        'setString',
        'setNumber',
        'setBoolean',
        'setDate',
        'setStringEnum',
        'level_3',
      ],
      additionalProperties: false,
    },
  },
  required: [
    'boolean',
    'number',
    'string',
    'stringEnum',
    'date',
    'setString',
    'setNumber',
    'setBoolean',
    'setDate',
    'setStringEnum',
    'level_2',
  ],
  additionalProperties: false,
  $schema: 'http://json-schema.org/draft-07/schema#',
};
