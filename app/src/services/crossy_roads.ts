/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/crossy_roads.json`.
 */
export type CrossyRoads = {
  "address": "HJqX4nHWvDjBjpsrmuvVtoWhHJiebbDv5y9UMtrkNbAS",
  "metadata": {
    "name": "crossyRoads",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "checkpointGame",
      "docs": [
        "Periodic checkpoint during gameplay"
      ],
      "discriminator": [
        89,
        211,
        138,
        212,
        195,
        142,
        178,
        122
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "magicContext",
          "writable": true
        },
        {
          "name": "magicProgram"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "delegateGameSession",
      "docs": [
        "Delegate the session PDA to an ER validator"
      ],
      "discriminator": [
        238,
        29,
        127,
        140,
        161,
        57,
        84,
        117
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bufferSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "session"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                242,
                76,
                185,
                118,
                161,
                164,
                202,
                42,
                156,
                248,
                151,
                180,
                190,
                81,
                124,
                5,
                62,
                23,
                120,
                210,
                10,
                251,
                2,
                52,
                48,
                203,
                157,
                20,
                47,
                3,
                39,
                67
              ]
            }
          }
        },
        {
          "name": "delegationRecordSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataSession",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "session"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "ownerProgram",
          "address": "HJqX4nHWvDjBjpsrmuvVtoWhHJiebbDv5y9UMtrkNbAS"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "endGame",
      "docs": [
        "End game, undelegate, commit, and close session account"
      ],
      "discriminator": [
        224,
        135,
        245,
        99,
        67,
        175,
        121,
        252
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "player",
          "writable": true,
          "signer": true,
          "relations": [
            "session"
          ]
        },
        {
          "name": "magicContext",
          "writable": true
        },
        {
          "name": "magicProgram"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "getGameState",
      "docs": [
        "View-only: Get current game state"
      ],
      "discriminator": [
        132,
        22,
        250,
        166,
        75,
        67,
        183,
        32
      ],
      "accounts": [
        {
          "name": "session",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        }
      ],
      "args": [],
      "returns": {
        "defined": {
          "name": "gameStateData"
        }
      }
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "startGame",
      "docs": [
        "Initialize a new game session and delegate it"
      ],
      "discriminator": [
        249,
        47,
        252,
        172,
        184,
        162,
        245,
        14
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "takeStep",
      "docs": [
        "Increment step counter - each step is a transaction during gameplay"
      ],
      "discriminator": [
        215,
        212,
        135,
        19,
        147,
        103,
        60,
        194
      ],
      "accounts": [
        {
          "name": "session",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  97,
                  109,
                  101,
                  95,
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "session.player",
                "account": "gameSession"
              }
            ]
          }
        },
        {
          "name": "player",
          "signer": true,
          "relations": [
            "session"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "gameSession",
      "discriminator": [
        150,
        116,
        20,
        197,
        205,
        121,
        220,
        240
      ]
    }
  ],
  "events": [
    {
      "name": "gameCheckpoint",
      "discriminator": [
        231,
        30,
        53,
        167,
        28,
        147,
        203,
        94
      ]
    },
    {
      "name": "gameEnded",
      "discriminator": [
        35,
        93,
        113,
        153,
        29,
        144,
        200,
        109
      ]
    },
    {
      "name": "gameStarted",
      "discriminator": [
        222,
        247,
        78,
        255,
        61,
        184,
        156,
        41
      ]
    },
    {
      "name": "stepTaken",
      "discriminator": [
        84,
        141,
        72,
        91,
        193,
        152,
        56,
        104
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "sessionNotActive",
      "msg": "Session is not active"
    },
    {
      "code": 6001,
      "name": "sessionAlreadyEnded",
      "msg": "Session already ended"
    }
  ],
  "types": [
    {
      "name": "gameCheckpoint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "stepCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "gameEnded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "stepCount",
            "type": "u32"
          },
          {
            "name": "duration",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "gameSession",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "stepCount",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "startedAt",
            "type": "i64"
          },
          {
            "name": "endedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "gameStarted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "gameStateData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "stepCount",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "startedAt",
            "type": "i64"
          },
          {
            "name": "endedAt",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "stepTaken",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "stepCount",
            "type": "u32"
          }
        ]
      }
    }
  ]
};
