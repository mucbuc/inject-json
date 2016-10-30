#!/usr/bin/env node

'use strict';

var assert = require( 'assert' )
  , traverse = require( 'traverjs' )
  , path = require( 'path' ) 
  , util = require( 'util' )
  , fs = require( 'fs' );

function lazyMerge( obj, propertyName, value ) {
  if (!obj.hasOwnProperty(propertyName)) {
    obj[propertyName] = value;
  }
  else {
    obj[propertyName] = Object.assign( obj[propertyName], value );
  }
  return obj;
}

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

const process_file = (pathJSON, injectTag) => {
  
  const objectReader = defaultObjectReader; 
  
  assert( typeof pathJSON !== 'undefined' );

  if (typeof injectTag === 'undefined') {
    injectTag = '#inject#';
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
              result = lazyMerge( result, fileJSON, sub ); 
              next();
            })
            .catch( () => {
              reject();
            });
          }
          else {
            result = lazyMerge( result, fileJSON, prop );
            next();
          }
        })
        .then( () => {
          resolve(result[fileJSON]); 
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
  
  var program = require( 'commander' );
  program
    .version( '0.0.0' )
    .usage('[options] <json file>')
    .option( '-i, --inject [keyword]', "inject keyword ['#inject#']")
    .parse(process.argv);
  
  if (program.args.length !== 1) {
    program.help();
  }
  else {
    process_file( program.args[0], program.inject )
    .then( (result) => {
      console.log( JSON.stringify(result, null, 2) );
    })
    .catch( (err) => {
      console.error( err ); 
    });
  }
} 