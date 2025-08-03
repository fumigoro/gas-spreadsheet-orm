import { WhereCondition, ColumnDefinition, InferModelType } from './types';

export class QueryEngine<T> {
  constructor(private data: T[]) {}

  // Where条件のマッチング
  private matchesWhere(item: T, where: WhereCondition<T>): boolean {
    return (Object.entries(where) as Array<[keyof T, any]>).every(([key, condition]) => {
      const value = item[key];
      
      if (condition === null || condition === undefined) {
        return value === condition;
      }
      
      if (typeof condition === 'object' && condition !== null) {
        // Type-safe condition handling
        return this.evaluateCondition(value, condition);
      } else {
        // Direct equality
        return value === condition;
      }
    });
  }

  private evaluateCondition<V>(value: V, condition: Record<string, unknown>): boolean {
    if ('equals' in condition) {
      return value === condition.equals;
    }
    
    if ('not' in condition) {
      return value !== condition.not;
    }
    
    if ('in' in condition && Array.isArray(condition.in)) {
      return condition.in.includes(value);
    }
    
    if ('notIn' in condition && Array.isArray(condition.notIn)) {
      return !condition.notIn.includes(value);
    }
    
    // Numeric/Date comparisons
    if (typeof value === 'number' || value instanceof Date) {
      if ('lt' in condition && (typeof condition.lt === 'number' || condition.lt instanceof Date)) {
        return value < condition.lt;
      }
      if ('lte' in condition && (typeof condition.lte === 'number' || condition.lte instanceof Date)) {
        return value <= condition.lte;
      }
      if ('gt' in condition && (typeof condition.gt === 'number' || condition.gt instanceof Date)) {
        return value > condition.gt;
      }
      if ('gte' in condition && (typeof condition.gte === 'number' || condition.gte instanceof Date)) {
        return value >= condition.gte;
      }
    }
    
    // String-specific operations
    if (typeof value === 'string') {
      if ('contains' in condition && typeof condition.contains === 'string') {
        return value.includes(condition.contains);
      }
      if ('startsWith' in condition && typeof condition.startsWith === 'string') {
        return value.startsWith(condition.startsWith);
      }
      if ('endsWith' in condition && typeof condition.endsWith === 'string') {
        return value.endsWith(condition.endsWith);
      }
    }
    
    return true;
  }

  // フィルタリング
  filter(where?: WhereCondition<T>): T[] {
    if (!where) return [...this.data];
    return this.data.filter(item => this.matchesWhere(item, where));
  }

  // ソート
  sort(orderBy?: { [K in keyof T]?: 'asc' | 'desc' }): T[] {
    if (!orderBy) return [...this.data];
    
    return [...this.data].sort((a, b) => {
      for (const [key, direction] of Object.entries(orderBy) as Array<[keyof T, 'asc' | 'desc']>) {
        const aVal = a[key];
        const bVal = b[key];
        
        let comparison = 0;
        
        // Handle different types safely
        if (aVal === null || aVal === undefined) {
          comparison = bVal === null || bVal === undefined ? 0 : -1;
        } else if (bVal === null || bVal === undefined) {
          comparison = 1;
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          // Fallback to string comparison
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  // ページング
  paginate(take?: number, skip?: number): T[] {
    let result = [...this.data];
    if (skip) result = result.slice(skip);
    if (take) result = result.slice(0, take);
    return result;
  }

  // 単一検索
  findFirst(where: WhereCondition<T>): T | undefined {
    return this.data.find(item => this.matchesWhere(item, where));
  }
}
