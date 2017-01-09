#!/usr/bin/env node
'use strict';

const testTape = require( 'tape' )
  , includer = require( './../inject-json.js' )
  , Expector = require( 'expector' ).Expector
  , path = require( 'path' );

function test( name, jsonPath, expected ) {
  
  console.log( 'cwd:', process.cwd() );
  console.log( 'json:', path.join( __dirname, jsonPath ) );

  testTape( name, (t) => {
    var controller = new Expector(t)
      , obj = require( expected );

    controller.expect( obj );
    includer( path.join( __dirname, jsonPath ) )
    .then( (result) => {
      controller.emit( result ).check();
    });
  }); 
}

test( 'recursive inject', 'test.json', './result.json' );
test( 'example', 'example/host.json', './example/result.json' );
