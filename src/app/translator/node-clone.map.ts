export interface NodeTrackEntry {
  id?: string;
  original: Node;
  cloned: Node;
}

export class NodeCloneMap {
  items: NodeTrackEntry[] = [];

  findByCloned(cloned: Node): NodeTrackEntry {
    return this.items.find(it => it.cloned === cloned);
  }

  findByOriginal(original: Node): NodeTrackEntry {
    return this.items.find(it => it.original === original);
  }

  add(original: Node, cloned: Node): void {
    const entry = this.findByOriginal(original);
    if (!!entry) {
      entry.cloned = cloned;
    } else {
      this.items.push({ original, cloned });
    }
  }

  findById(id: string): NodeTrackEntry {
    return this.items.find(it => it.id === id);
  }
}
