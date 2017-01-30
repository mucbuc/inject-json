#!/usr/bin/env node
'use strict';

const testTape = require( 'tape' )
  , includer = require( './../inject-json.js' )
  , Expector = require( 'expector' ).Expector
  , path = require( 'path' );

function test( name, jsonPath, expected ) {

  testTape( name, (t) => {
    var controller = new Expector(t)
      , obj = require( expected );

    controller.expect( obj );
    includer( path.join( __dirname, jsonPath ) )
    .then( (result) => {
      
      console.log( 'result:', JSON.stringify( result, null, 2 ) );
      controller.emit( result ).check();
    });
  }); 
}

test( 'recursive inject', 'test.json', './result.json' );
test( 'example', 'example/host.json', './example/result.json' );
test( 'nested inject', 'nested.json', './nested_result.json' );

test( 'skip regression', 'branch.json', './branch.json' );