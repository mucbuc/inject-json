#!/usr/bin/env node

'use strict';

const processFile = require( './index' )
  , program = require( 'commander' );

program
  .version( '0.0.5' )
  .usage('[options] <json file>')
  .option( '-i, --inject [keyword]', "inject keyword ['#inject#']" )
  .option( '-m, --merge [function]', 'specify merge. default = (next, path, cb) => {cb( next );}' )
  .parse(process.argv);
  
if (program.args.length !== 1) {
  program.help();
}
else {
  let merge; 
  if (program.merge) {
    const vm = require( 'vm' )
      , context = vm.createContext()
      , script = new vm.Script( program.merge );
  
    merge = script.runInContext( context ); 
  }

  processFile( program.args[0], program.inject, merge )
  .then( (result) => {
    console.log( JSON.stringify(result, null, 2) );
  })
  .catch( (err) => {
    console.error( err ); 
  });
}