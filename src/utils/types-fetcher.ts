interface TypeFile {
  module: string;
  path: string;
  content: string;
}

async function fetchPackageJson(name: string) {
  return await fetch(`https://unpkg.com/${name}/package.json`)
    .then((response) => response.json());
}

async function fetchTypeFiles(name: string, ...files: string[]): Promise<Omit<TypeFile, 'module'>[]> {
  return await fetch(`https://unpkg.com/${name}/${files[0].replace(/\.d\.ts$|\.d$|$/, '.d.ts')}`)
    .then((response) => response.text())
    .then((content) => [{
      path: files[0],
      content,
    }]);
}

export async function fetchTypes(name: string): Promise<TypeFile[]> {
  // It has specific file imported
  if (name[0] !== '@' && /\//.test(name)) {
    const path = name.split('/');
    const files = await fetchTypeFiles(path.shift()!, ...path);

    if (files.length) {
      return files.map((data) => ({
        module: name,
        ...data,
      }));
    }

    return [];
  }

  const packageJSON = await fetchPackageJson(name);

  if (!packageJSON) {
    return [];
  }

  // It has internal types
  if (packageJSON && packageJSON.types) {
    // const files = await fetchTypeFiles(`${name}@${packageJSON.version}`, packageJSON.types);
    const files = await fetchTypeFiles(name, packageJSON.types);

    if (files.length) {
      return files.map((data) => ({
        module: name,
        ...data,
      }));
    }
  }

  const typesPackageJSON = await fetchPackageJson(`@types/${name}`);

  // It has external types
  if (typesPackageJSON && typesPackageJSON.types) {
    // const files = await fetchTypeFiles(`@types/${name}@${typesPackageJSON.version}`, typesPackageJSON.types);
    const files = await fetchTypeFiles(`@types/${name}`, typesPackageJSON.types);

    if (files.length) {
      return files.map((data) => ({
        module: name,
        ...data,
      }));
    }
  }

  return [];
}
