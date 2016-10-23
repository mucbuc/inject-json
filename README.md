# inclujson
include for json

###example
{
  "include": "../someother.json"
}

someother.json: 
{
  "a": [ 1, 2, 3 ]
}

=> 

{
  "someother": {
    "a": [ 1, 2, 3 ]
  }
}
