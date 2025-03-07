import { ValuePointer } from '@sinclair/typebox/value';
import {
  FetchExecutionContext,
  FetchFromStorageOptions,
  loadSubquery,
} from '../collection-query.js';
import { InvalidFilterError, QueryNotPreparedError } from '../errors.js';
import {
  isBooleanFilter,
  isExistsFilter,
  isFilterGroup,
  isFilterStatement,
  isSubQueryFilter,
} from '../query.js';
import { Entity } from '../entity.js';
import { getAttributeFromSchema } from '../schema/schema.js';
import { Models } from '../schema/types/index.js';
import { TripleStoreApi } from '../triple-store.js';
import { everyAsync, someAsync } from '../utils/async.js';
import {
  FilterStatement,
  SubQueryFilter,
  WhereFilter,
  CollectionQuery,
  Operator,
} from './types/index.js';

/**
 * During query execution, determine if an entity satisfies a filter
 */
export async function satisfiesFilter<Q extends CollectionQuery>(
  tx: TripleStoreApi,
  query: Q,
  executionContext: FetchExecutionContext,
  options: FetchFromStorageOptions,
  entityEntry: [entityId: string, entity: Entity],
  filter: WhereFilter<any, any>
): Promise<boolean> {
  if (isBooleanFilter(filter)) return filter;
  if (isFilterGroup(filter)) {
    const { mod, filters } = filter;
    if (mod === 'and') {
      const filterOrder = getFilterPriorityOrder(filters);
      return await everyAsync(filterOrder, (idx) =>
        satisfiesFilter(
          tx,
          query,
          executionContext,
          options,
          entityEntry,
          filters[idx]
        )
      );
    }
    if (mod === 'or') {
      const filterOrder = getFilterPriorityOrder(filters);
      return await someAsync(filterOrder, (idx) =>
        satisfiesFilter(
          tx,
          query,
          executionContext,
          options,
          entityEntry,
          filters[idx]
        )
      );
    }
    return false;
  }
  if (isSubQueryFilter(filter)) {
    return await satisfiesRelationalFilter(
      tx,
      query,
      executionContext,
      options,
      entityEntry,
      filter
    );
  }

  // TODO: we need to refactor our types have a clearer distinction between query inputs and prepared queries
  // Ex. CollectionQuery<M, CN> vs Prepared<CollectionQuery<M, CN>>
  if (isExistsFilter(filter)) {
    throw new QueryNotPreparedError('Untranslated exists filter');
  }

  return satisfiesFilterStatement(query, options, entityEntry[1], filter);
}

async function satisfiesRelationalFilter<
  M extends Models,
  Q extends CollectionQuery<M, any>,
>(
  tx: TripleStoreApi,
  query: Q,
  executionContext: FetchExecutionContext,
  options: FetchFromStorageOptions,
  entityEntry: [entityId: string, entity: Entity],
  filter: SubQueryFilter<M, Q['collectionName']>
) {
  const { exists: subQuery } = filter;
  const existsSubQuery = {
    ...subQuery,
    limit: 1,
  };

  const subQueryResult = await loadSubquery(
    tx,
    query,
    existsSubQuery,
    'one',
    executionContext,
    options,
    'exists',
    entityEntry
  );

  if (subQueryResult) executionContext.fulfillmentEntities.add(subQueryResult);
  return !!subQueryResult;
}

function satisfiesFilterStatement<
  M extends Models,
  Q extends CollectionQuery<M, any>,
>(
  query: Q,
  options: FetchFromStorageOptions,
  entity: Entity,
  filter: FilterStatement<M, Q['collectionName']>
) {
  const { collectionName } = query;
  const { schema } = options;
  const [path, op, filterValue] = filter;
  const dataType = schema
    ? getAttributeFromSchema(path.split('.'), schema, collectionName)
    : undefined;
  // If we have a schema handle specific cases
  if (dataType && dataType.type === 'set') {
    return satisfiesSetFilter(entity.data, path, op, filterValue);
  }
  // Use register as default
  return satisfiesRegisterFilter(entity.data, path, op, filterValue);
}

export function satisfiesSetFilter(
  data: Record<string, any>,
  path: string,
  op: Operator,
  filterValue: any
) {
  const pointer = '/' + path.replaceAll('.', '/');
  const setData: Record<string, boolean> = ValuePointer.Get(data, pointer);
  if (op === 'has') {
    if (!setData) return false;
    const filteredSet = Object.entries(setData).filter(([_v, inSet]) => inSet);
    return filteredSet.some(([v]) => v === filterValue);
  } else if (op === '!has') {
    if (!setData) return true;
    const filteredSet = Object.entries(setData).filter(([_v, inSet]) => inSet);
    return filteredSet.every(([v]) => v !== filterValue);
  } else if (op === 'isDefined') {
    return filterValue ? setData !== undefined : setData === undefined;
  } else {
    if (!setData) return false;
    const filteredSet = Object.entries(setData).filter(([_v, inSet]) => inSet);
    return filteredSet.some(([v]) => isOperatorSatisfied(op, v, filterValue));
  }
}

export function satisfiesRegisterFilter(
  data: Record<string, any>,
  path: string,
  op: Operator,
  filterValue: any
) {
  const value = ValuePointer.Get(data, '/' + path.replaceAll('.', '/'));
  return isOperatorSatisfied(op, value, filterValue);
}

function isOperatorSatisfied(op: Operator, value: any, filterValue: any) {
  switch (op) {
    case '=':
      return value == filterValue;
    case '!=':
      return value !== filterValue;
    case '>':
      // Null is not greater than anything
      if (value === null) return false;
      // Null is less than everything
      if (filterValue === null) return true;
      return value > filterValue;
    case '>=':
      if (value === null) return filterValue === null;
      if (filterValue === null) return true;
      return value >= filterValue;
    case '<':
      // Null is not less than anything
      if (filterValue === null) return false;
      // Null is less than everything
      if (value === null) return true;
      return value < filterValue;
    case '<=':
      if (filterValue === null) return value === null;
      if (value === null) return true;
      return value <= filterValue;

    //TODO: move regex initialization outside of the scan loop to improve performance
    case 'like':
      return ilike(value, filterValue);
    case 'nlike':
      return !ilike(value, filterValue);
    case 'in':
      return new Set(filterValue).has(value);
    case 'nin':
      return !new Set(filterValue).has(value);

    case 'isDefined':
      return filterValue ? value !== undefined : value === undefined;
    default:
      throw new InvalidFilterError(`The operator ${op} is not recognized.`);
  }
}

function ilike(text: string, pattern: string): boolean {
  // Escape special regex characters in the pattern
  pattern = pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  // Replace SQL LIKE wildcards (%) with equivalent regex wildcards (.*)
  pattern = pattern.replace(/%/g, '.*');

  // Replace SQL LIKE single-character wildcards (_) with equivalent regex wildcards (.)
  pattern = pattern.replace(/_/g, '.');

  // Create a RegExp object from the pattern
  const regex = new RegExp(`^${pattern}$`, 'i');

  // Test the text against the regex
  return regex.test(text);
}

function determineFilterType(
  filter: WhereFilter<any, any>
): 'boolean' | 'basic' | 'group' | 'relational' {
  if (isFilterStatement(filter)) return 'basic';
  if (isSubQueryFilter(filter)) return 'relational';
  if (isFilterGroup(filter)) return 'group';
  if (isBooleanFilter(filter)) return 'boolean';
  throw new InvalidFilterError(
    `Filter type could not be determined: ${JSON.stringify(filter)}`
  );
}

/**
 * Based on the type of filter, determine its priority in execution
 * 1. Boolean filters
 * 2. Basic filters
 * 3. Group filters (which are then ordered by their own priority)
 * 4. Relational filters (subqueries, will take the longest to execute)
 */
export function getFilterPriorityOrder(
  where: CollectionQuery<any, any>['where']
): number[] {
  if (!where) return [];
  const basicFilters = [];
  const booleanFilters = [];
  const groupFilters = [];
  const relationalFilters = [];

  for (let i = 0; i < where.length; i++) {
    const filter = where[i];
    const filterType = determineFilterType(filter);
    switch (filterType) {
      case 'boolean':
        booleanFilters.push(i);
        break;
      case 'basic':
        basicFilters.push(i);
        break;
      case 'group':
        groupFilters.push(i);
        break;
      case 'relational':
        relationalFilters.push(i);
        break;
    }
  }

  return [
    ...booleanFilters,
    ...basicFilters,
    ...groupFilters,
    ...relationalFilters,
  ];
}
