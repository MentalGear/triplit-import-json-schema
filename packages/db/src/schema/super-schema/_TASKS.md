### Tasks

[ ] write tasklist / tasks example
    -> use templates/super-schema-svelte

[ ] ts type safty

[x] write test for none-flat objects using "schemaComplexZod"

[x] check if 1st level of js object has an id
    if not:
        - error: yes
        - autofill: no, else generated schema different from what is visible in main schema
    [x] write test for it
    [x] Do sub-objects also need "id" or only S.Schema objects ?
        Resolved: 'id' is only needed for top level S.Schema, not S.Record items!
    [x] id handeling: custom id keywords
        1. splitschema add 'ids'
            as it is neither Triplit nor Validation specific
                could just use S.String(  ... ) or S.id ?
        2. generateTriplitSchema: transform id -> S.string( nullable )
        3. generateValidationSchema: transform id -> custom default generation, custom verification: z.refine( customcheck ).default( generate_uuid/nanoid )


[x] No: id = "nano" mapping to get specifc nanoid mapping from ValidationAdapter ?
    [x] still needed? No.
        Triplit allows any string as id
        So: Why should this still be needed? If it is needed, they can check if their framework has method for it, doesnt need to be provided by the Validation Adapter
        Ref: https://www.triplit.dev/docs/schemas#id

        // which I do not think we should since they offical superschema number of props will then look different from the generated schema
        //     // so, if there is no id, and triplit fill it in automatically, we know it's a nanoid
  //     return z.string().nanoid();

[x] possible to use jsonSchema $refs to indicate relations in triplitSchemaFromJson ?
    Why would this be necessary? If the user can select object is a list of a different type, that object shape can be directly used by the app logic to verfiy it
    relations only show what tables are linked, not the structure of the linked tables. the link is not relevant for the validation library, only the reference id which is a different field.


[x] does zodToJsonSchema fill in defaults to jsonSchema's default ?
    yes

[x] How to handle self reference ?
    E.g. 
    User:  z.object({
        name: z.string,
        id: z.string,
    })
    task: z.object({
        userId: User.shape.id, // Reference to User
    })

    Resolved:
    - Solution: it should be on zod compilation / jsonschema be "under the hood" compiled together without
    - any added stuff from me.
    [ ] write a test for it