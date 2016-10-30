# inject-json

inject json files in json file

####example
`cat host.json` => 
```
{
  "#inject#": [
    "dep.json"
  ]
}
```
`cat dep.json` => 
```
{
  "version": "1.2.3"
}
```
`inject-json host.json` =>
```
{
  "dep.json": {
    "version": "1.2.3"
  }
}
```

####install
`npm install inject-json`

####usage 
```
  Usage: inject-json [options] <json file>

  Options:

    -h, --help              output usage information
    -V, --version           output the version number
    -i, --inject [keyword]  inject keyword ['#inject#']
```

####roadmap
- fetch urls