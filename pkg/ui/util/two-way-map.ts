class TwoWayReadonlyMap<T, K> {
  map: Map<T, K>;
  reverseMap: Map<K, T>;
  constructor(map: Map<T, K>) {
    this.map = map;
    this.reverseMap = new Map<K, T>();
    map.forEach((value, key) => {
      this.reverseMap.set(value, key);
    });
  }
  get(key: T) {
    return this.map.get(key);
  }
  revGet(key: K) {
    return this.reverseMap.get(key);
  }
}

export default TwoWayReadonlyMap
