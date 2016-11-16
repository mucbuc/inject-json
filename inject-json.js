#!/usr/bin/env node

'use strict';

var assert = require( 'assert' )
  , traverse = require( 'traverjs' )
  , path = require( 'path' ) 
  , util = require( 'util' )
  , fs = require( 'fs' );

function defaultObjectReader(filePath, cb) {
  fs.readFile( filePath, (err, data) => {
    
    if (err) 
      onError(err);
    
    try {
      const content = JSON.parse(data.toString());
      cb( content ); 
    }
    catch(err)
    {
      console.error( err ); 
    }

    function onError(err) {
      console.error( 'error processing file at: ', filePath, ' cwd: ', process.cwd() );
      throw err;
    }
  });
};

function process_file(pathJSON, injectTag, merge) {
  
  const objectReader = defaultObjectReader; 
  
  assert( typeof pathJSON !== 'undefined' );

  if (typeof injectTag === 'undefined') {
    injectTag = '#inject#';
  }

  if (typeof merge === 'undefined') {
    merge = (result, next, path, cb) => {
      cb( Object.assign( result, next ) );
    }; 
  }

  return processJSON( path.relative( process.cwd(), pathJSON ) ); 

  function processJSON(fileJSON) {
    return new Promise( (resolve, reject) => {
      objectReader( fileJSON, (content) => {
        
        var result = {};
        traverse( content, (prop, next) => {

          if (prop.hasOwnProperty(injectTag)) {
            processIncludes( prop[injectTag], fileJSON )
            .then( (sub) => {
              merge( result, sub, fileJSON, ( merged ) => {
                result = merged;
                next(); 
              });
            
            })
            .catch( reject );
          }
          else {
            merge( result, prop, fileJSON, ( merged ) => {
              result = merged;
              next(); 
            });
          }
        })
        .then( () => {
          resolve( result ); 
        })
        .catch( reject );

      });
    });
  }

  function processIncludes(includes, fileJSON, cb) {
    return new Promise( (resolve, reject) => {
      var result = {};
      const dirJSON = path.dirname(fileJSON);
      traverse( includes, ( item, next ) => {
        processJSON( path.join( dirJSON, item ) )
        .then( (sub) => {
          
          result[item] = sub;
          next(); 
        })
        .catch( reject );
      })
      .then( () => {
        resolve(result); 
      } )
      .catch( reject );
    });
  }
    
};

if (module.parent) {
  module.exports = process_file;
  return;
}
else {
  
  let program = require( 'commander' );
  program
    .version( '0.0.0' )
    .usage('[options] <json file>')
    .option( '-i, --inject [keyword]', "inject keyword ['#inject#']" )
    .option( '-m, --merge [function]', 'specify merge. default = (result, next, cb) => { cb( Object.assign( result, next ) ); }' )
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

    process_file( program.args[0], program.inject, merge )
    .then( (result) => {
      console.log( JSON.stringify(result, null, 2) );
    })
    .catch( (err) => {
      console.error( err ); 
    });
  }
} 