import { CodeEditor } from "@/registry/default/ui/code-editor"

export default function CodeEditorDarkDemo() {
  return (
    <CodeEditor
      defaultValue={`use std::collections::HashMap;

#[derive(Debug)]
struct Cache<K, V> {
    store: HashMap<K, V>,
    capacity: usize,
}

impl<K, V> Cache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    fn new(capacity: usize) -> Self {
        Cache {
            store: HashMap::with_capacity(capacity),
            capacity,
        }
    }

    fn get(&self, key: &K) -> Option<&V> {
        self.store.get(key)
    }

    fn insert(&mut self, key: K, value: V) {
        if self.store.len() >= self.capacity && !self.store.contains_key(&key) {
            // Simple eviction: remove the first item (not LRU)
            if let Some(first_key) = self.store.keys().next().cloned() {
                self.store.remove(&first_key);
            }
        }
        self.store.insert(key, value);
    }
}

fn main() {
    let mut cache = Cache::new(3);

    cache.insert("key1", "value1");
    cache.insert("key2", "value2");
    cache.insert("key3", "value3");

    println!("Cache contents: {:?}", cache);

    // This will trigger eviction
    cache.insert("key4", "value4");

    println!("After eviction: {:?}", cache);
}`}
      language="rust"
      height="500px"
      theme="dark"
    />
  )
}
