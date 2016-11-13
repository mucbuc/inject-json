#!/usr/bin/env node
'use strict';

const testTape = require( 'tape' )
  , includer = require( './../inject-json.js' )
  , Expector = require( 'expector' ).Expector
  , stringify = require('json-stable-stringify')
  , path = require( 'path' );

function test( name, jsonPath, expected ) {
  
  testTape( name, (t) => {
    var controller = new Expector(t)
      , obj = require( expected );

    controller.expect( stringify(obj) );
    includer( path.join( __dirname, jsonPath ) )
    .then( (result) => {
      controller.emit( stringify( result ) ).check();
    });
  }); 
}

test( 'recursive inject', 'test.json', './result.json' );
test( 'example', 'example/host.json', './example/result.json' );
