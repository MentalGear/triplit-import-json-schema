export function transformObjectDeeply(
  object: any,
  transformFunction: (
    object: any,
    overlyingObj: { [key: string]: any },
    currentObjKey: string
  ) => any,
  overlyingObj = {},
  currentObjKey = ''
) {
  // guard
  if (!object) return;
  if (typeof object !== 'object') return;

  // NOTE: we cant iterate over all keys and apply transformations
  // since this will miss keys with transforms that mutate keys (eg omitRelationship deletes keys)
  // instead, we must transform one after another
  transformFunction.apply(null, [object, overlyingObj, currentObjKey]);

  if (object) {
    // Recursively apply to sub nodes
    for (const key in object) {
      // go a level deeper
      transformObjectDeeply(object[key], transformFunction, object, key);
    }
  }

  return object;
}
