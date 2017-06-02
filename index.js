#!/usr/bin/env node

'use strict';

const assert = require( 'assert' )
  , walkJSON = require( 'walk-json' )
  , traverse = require( 'traverjs' )
  , path = require( 'path' ) 
  , fs = require( 'fs' );

function defaultObjectReader(filePath, cb) {
  fs.readFile( filePath, (err, data) => {
    
    if (err) {
      onError(err);
    }
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

function processFile(pathJSON, injectTag, merge) {
  
  assert( typeof pathJSON !== 'undefined' );

  const objectReader = defaultObjectReader;
  
  if (typeof injectTag === 'undefined') {
    injectTag = '#inject#';
  }

  if (typeof merge === 'undefined') {
    merge = (next, path, cb) => {
      cb( next );
    }; 
  }

  return processJSON( pathJSON, path.relative(process.cwd(), path.dirname(pathJSON) ) ); 

  function processJSON(fileJSON, root ) {
    return new Promise( (resolve, reject) => {
      objectReader( fileJSON, (content) => {
        processJSONContent(content, fileJSON, root)
        .then( resolve )
        .catch( reject );
      });
    });
  }

  function processJSONContent(content, fileJSON, root) {
    return new Promise( (resolve, reject) => {
      var result = {};
      walkJSON( content, (prop, propName, next, skip) => {
        if (propName.endsWith(injectTag)) {

          processIncludes( prop, root )
          .then( (sub) => {
            
            if (propName == injectTag)
            {
              merge( sub, fileJSON, ( merged ) => {
                result = Object.assign( result, merged );
                skip(); 
              });
            }
            else
            {
              let name = propName.substr(0, propName.length - injectTag.length);
              merge( {[name]: sub}, fileJSON, ( merged ) => {
                result = Object.assign( result, merged );
                skip(); 
              });
            }
          
          })
          .catch( reject );
        }
        else if (   typeof prop === 'object'
                &&  !Array.isArray(prop))
        {
          processJSONContent( prop, fileJSON)
          .then( sub => {
            merge( {[propName]: sub}, fileJSON, ( merged ) => {
              result = Object.assign( result, merged );
              skip();
            });

          });
        }
        else {
          merge( {[propName]: prop}, fileJSON, ( merged ) => {
            result = Object.assign( result, merged );
            next();
          });
        }
      })
      .then( () => {
        resolve( result ); 
      })
      .catch( reject );
    });
  }

  function processIncludes(includes, root) {
    return new Promise( (resolve, reject) => {
      var result = {};
      traverse( includes, ( item, next ) => {
        
        item = path.join(root, item);

        processJSON( item, path.dirname(item) )
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

module.exports = processFile;