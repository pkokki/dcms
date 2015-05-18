angular.module('dcmsData', [
    ])
    .factory('dcmsData', ['$q', function($q) {
        var data = {
            customers: [
                { id: 1, accounts: [{ id: 1, billTo: [ { id:1 } ] }] }
            ],
            delinquencies: [{
                id: 1,
                customerId: 1, accountId: 1, billToId: 1,
                scheduledPayments: [
                    { id: 1, dueDate: '2015-03-01T00:00:00', dueAmount: 200 },
                    { id: 2, dueDate: '2015-02-01T00:00:00', dueAmount: 800 },
                ],
                status: 'DELINQUENT', creationDate: '2015-04-24T00:00:00',
                totalAmountDue: 1000,
                agingBucketId: null, agingBucketLineId: null
            }],
            agingBuckets: [{
                id: 1,
                name: 'Bucket #1',
                description: 'The description of the bucket number one.',
                enabled: true,
                lines: [
                    { seq: 1, daysFrom: null, daysTo: 0, type: 'Current', heading: 'Current' },
                    { seq: 2, daysFrom: 1, daysTo: 53, type: 'PastDue', heading: '1-53 days past' },
                    { seq: 3, daysFrom: 54, daysTo: 60, type: 'PastDue', heading: '54-60 days past' },
                    { seq: 4, daysFrom: 61, daysTo: null, type: 'PastDue', heading: '61+ days past' },
                ]
            }, {
                id: 2,
                name: 'Bucket #2',
                description: 'The description of the bucket.',
                enabled: false,
            }],
            scoringParts: [
                { id: 1, name:'delinquencies amount', description: 'total delinquencies amount for account', enabled: true, userDefined: false, type: 'rule', value: null },
                { id: 2, name:'customer since', description: 'time span in years', enabled: false, userDefined: false, type: 'resx', value: null },
                { id: 3, name:'number of delinquencies', description: 'count of records', enabled: true, userDefined: false, type: 'expr', value: null },
                { id: 4, name:'due date is greater than today', description: '', enabled: true, userDefined: false, type: 'expr', value: '@.dueDate > $.today' },
            ],
            scorers: [
                {
                    id: 1001, name:'Customer Scorer',
                    description: 'Scores the party (customer). Displays the score in the Collections Score field in the Collections Header.',
                    enabled: true, userDefined: false,
                    level: 'Customer', segment: 'Delinquent Parties Filter',
                    minScore: 0, maxScore: 100, weightRequired: true,
                    parts: []
                },
                {
                    id: 1002, name:'Account Scorer',
                    description: 'Scores the account. Displays the score in the Score field on the Accounts tab.',
                    enabled: true, userDefined: false,
                    level: 'Account', segment: 'Accounts Filter',
                    minScore: 0, maxScore: 100, weightRequired: true,
                    parts: []
                },
                {
                    id: 1003, name:'Bill To Scorer',
                    description: 'Scores the Bill To sites.',
                    enabled: true, userDefined: false,
                    level: 'BillTo', segment: 'Delinquent Bill Site To Filter',
                    minScore: 0, maxScore: 100, weightRequired: true,
                    parts: []
                },
                {
                    id: 1004, name:'Delinquency Status Determination',
                    description: 'Scores transactions to determine status of current or delinquent.',
                    enabled: true, userDefined: false,
                    level: 'Transactions', segment: 'Invoice Delinquency Filter',
                    minScore: 0, maxScore: 100, weightRequired: false,
                    parts: [ { id: 4, name: 'due date is greater than today' }]
                },
                { id: 1, name:'custom scorer with two parts', description: 'a scorer ', enabled: true, userDefined: true,
                  level: 'BillTo', minScore: 0, maxScore: 100, weightRequired: true,
                  parts: [{ id: 1, name:'delinquencies amount', weight: 70 }, { id: 3, name:'number of delinquencies', weight: 30 }] },
            ],
            letterPlans: [
                { id: 1, name: 'plan #1', description: 'plan #1 description', level: 'Account', enabled: true, scorerId: 1, bucketId: 1 },
                { id: 2, name: 'plan #2', description: null, level: 'BillTo', enabled: true, scorerId: 1, bucketId: 1,
                    scorerParts: [{id: 1, name: "delinquencies amount", weight: 100}, {id: 3, name: "number of delinquencies", weight: 0}],
                    planLines: [
                        {bucketLine: {id:1, heading: "1-53 days past"}, scoreLow: 0, scoreHigh: 60, method: "Email", template:{id: 2, name: "tx2"}},
                        {bucketLine: {id:1, heading: "1-53 days past"}, scoreLow: 61, scoreHigh: 100, method: "Email", template:{id: 2, name: "tx2"}, callback: { enabled:true, days:5}},
                    ]
                },
            ],
            letterTemplates: [
                {
                    id: 1, code:'TMPL001', name: 'template #1', description: 'a description for template #1',
                    enabled: true, startDate: '2015-04-30T21:00:00.000Z', endDate: '2015-05-30T21:00:00.000Z',
                    files: [
                        { filename: 'TMPL001.docx', language: 'en' }
                    ]
                },
            ],
            jobTasksTypes: /* CaseSpecifications with Code like #DC___ */[
                {
                    Id: 101, Code: '#DC01', Name: 'Scoring Engine',
                    Description: 'Scores and creates delinquencies, and scores customers, accounts, or bill-to locations. Can have up to four scorers to the job instance.', Definition: {
                    Properties: {
                        Scorer1: { DataType: 'int' },
                        Scorer2: { DataType: 'int' },
                        Scorer3: { DataType: 'int' },
                        Scorer4: { DataType: 'int' },
                    },
                    InMappings: [
                        { Source: 'arguments.Scorer1', Target: 'container.Properties.Scorer1' },
                        { Source: 'arguments.Scorer2', Target: 'container.Properties.Scorer2' },
                        { Source: 'arguments.Scorer3', Target: 'container.Properties.Scorer3' },
                        { Source: 'arguments.Scorer4', Target: 'container.Properties.Scorer4' },
                    ],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'ScoringEngine', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 102, Code: '#DC02', Name: 'Promise Reconciliation',
                    Description: 'Verifies if payments were posted for invoices with promises; creates broken promise items for universal task list.', Definition: {
                    Properties: {},
                    InMappings: [],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'PromiseReconciliation', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 103, Code: '#DC03', Name: 'Send Letters for Delinquent Customers',
                    Description: 'Compares the score of the object with the active letter plan and sends the letters for all appropriate delinquent customers.', Definition: {
                    Properties: {
                        PlanId: { DataType: 'int' },
                        FromDate: { DataType: 'date' },
                        Preliminary: { DataType: 'boolean' },
                    },
                    InMappings: [
                        { Source: 'arguments.PlanId', Target: 'container.Properties.PlanId' },
                        { Source: 'arguments.FromDate', Target: 'container.Properties.FromDate' },
                        { Source: 'arguments.Preliminary', Target: 'container.Properties.Preliminary' },
                    ],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'SendLettersForDelinquentCustomers', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 104, Code: '#DC04', Name: 'Broken Promise Callbacks',
                    Description: 'Reviews the letter plan and creates all necessary callback tasks for delinquent customers.', Definition: {
                    Properties: {},
                    InMappings: [],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'BrokenPromiseCallbacks', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 105, Code: '#DC05', Name: 'Collection Strategy Workflow',
                    Description: 'Initiates the execution of assigned strategies and continues monitoring strategies in progress.', Definition: {
                    Properties: {},
                    InMappings: [],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'CollectionStrategyWorkflow', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 106, Code: '#DC06', Name: 'Strategy Fulfillment Mailer',
                    Description: 'Executes automated correspondence work items for strategies.', Definition: {
                    Properties: {},
                    InMappings: [],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'StrategyFulfillmentMailer', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 107, Code: '#DC07', Name: 'Strategy Management',
                    Description: 'Compares the object`s score with available strategies` ranks and assign appropriate strategies. It also creates work items in active strategies.', Definition: {
                    Properties: {},
                    InMappings: [],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'StrategyManagement', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 201, Code: '#DC08', Name: 'Populate universal task summaries',
                    Description: 'Updates delinquent customer data in the Collector`s Work Queue.', Definition: {
                    Properties: {
                        FromDate: { DataType: 'date', Description: 'Leave the parameter blank to run the program in total refresh mode or enter the date the program last ran for incremental mode.' },
                    },
                    InMappings: [
                        { Source: 'arguments.FromDate', Target: 'container.Properties.FromDate' },
                    ],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'PopulateUniversalTaskSummaries', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 202, Code: '#DC09', Name: 'Clear Delinquency Buffers',
                    Description: 'Clears the buffer tables used in scoring. Run it only if the scoring job stops before completing.', Definition: {
                    Properties: {},
                    InMappings: [],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'ClearDelinquencyBuffers', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
                {
                    Id: 203, Code: '#DC10', Name: 'Purge Score History',
                    Description: 'Run this after scoring if you do not want to save historical scoring data.', Definition: {
                    Properties: {},
                    InMappings: [],
                    Nodes: {
                        N1: { Type: 'StartEvent' },
                        N2: { Type: 'CodeActivity', Parameters: { Operation: 'ClearDelinquencyBuffers', Arguments: 'container.Properties' } },
                        N3: { Type: 'EndEvent' },
                    },
                    Transitions: [
                        { Source: 'N1', Target: 'N2' },
                        { Source: 'N2', Target: 'N3' },
                    ]
                }},
            ],
            jobTasks: [],
            targetGroups: [
                {
                    id: 1,
                    name: 'default parties',
                    description: 'all party resources',
                    enabled: true,
                    bs: {
                        endpoint: 'http://atlasV5.azurewebsites.net/business/api/',
                        security: {
                            type: 'oauth2',
                            oauth2: {
                                uri: 'http://atlasV5.azurewebsites.net/id/api/',
                                username: 'DCMS_OPERATOR',
                                password: 'DCMS_OPERATOR'
                            }
                        },
                        resourceName: 'Party',
                        queryName: null,
                        viewName: null
                    }
                },
            ],
            strategies: [
                {id: 1, name: 'default strategy', description: 'The default strategy description', enabled: true}
            ],
            campaigns: [{
                id: 1, name: 'default campaign', description: 'The default campaign description', enabled: true,
                targetGroup: { id: 1, name: 'default parties' },
                strategy: { id: 1, name: 'default strategy' }
            },
            ],
            tasks: [],
        };
        var traverseForArray = function(target, name) {
            var obj = target[name];
            if (angular.isArray(obj)) {
                return obj;
            }
            else {
                for (var p in target) {
                    if (angular.isArray(target[p]))
                    {
                        var child = traverseForArray(target[p], name);
                        if (child) {
                            return child;
                        }
                    }
                }
                return null;
            }
        };
        var theService = {
            getEntities: function(type) {
                return $q(function(resolve, reject) {
                    var entities = traverseForArray(data, type);
                    if (entities)
                        resolve(JSON.parse(JSON.stringify(entities)));
                    else
                        reject('Entity type "' + type + '" not found.')
                });
            },
            getEntity: function(type, id, key) {
                return $q(function(resolve, reject) {
                    key = key || 'id';
                    var entities = traverseForArray(data, type);
                    if (entities) {
                        var found = null;
                        for (var i = 0; i < entities.length; i++) {
                            var entity = entities[i];
                            if (entity && entity[key] == id) {
                                found = entity;
                                break;
                            }
                        }
                        resolve(JSON.parse(JSON.stringify(found)));
                    }
                    else {
                        reject('Entity type "' + type + '" not found.');
                    }
                });
            },
            createEntity: function(type, entity, key) {
                return $q(function(resolve, reject) {
                    key = key || 'id';
                    var entities = traverseForArray(data, type);
                    if (entities) {
                        var max = 0;
                        for (var i = 0; i < entities.length; i++) {
                            max = Math.max(max, entities[i][key]);
                        }
                        var newObj = {};
                        newObj[key] = max + 1;
                        var input = JSON.parse(JSON.stringify(entity));
                        delete input[key];
                        angular.extend(newObj, input);
                        entities.push(newObj);
                        resolve(JSON.parse(JSON.stringify(newObj)));
                    }
                    else {
                        reject('Entity type "' + type + '" not found.');
                    }
                });
            },
            updateEntity: function(type, entity, key) {
                return $q(function(resolve, reject) {
                    key = key || 'id';
                    if (entity && entity[key]) {
                        var entities = traverseForArray(data, type);
                        if (entities) {
                            var found = null;
                            for (var i = 0; i < entities.length; i++) {
                                if(entities[i][key] == entity[key]) {
                                    found = entities[i];
                                    break;
                                }
                            }
                            if (found) {
                                var input = JSON.parse(JSON.stringify(entity));
                                angular.extend(found, input);
                                resolve(JSON.parse(JSON.stringify(found)));
                            }
                            else {
                                reject('Entity with key "' + entity[key] + '" and type "'
                                    + type + '" not exists.');
                            }
                        }
                        else {
                            reject('Entity type "' + type + '" not found.');
                        }
                    }
                    else {
                        reject('Entity is null or has no key.');
                    }
                });
            },
            deleteEntity: function(type, id, key) {
                return $q(function(resolve, reject) {
                    key = key || 'id';
                    var entities = traverseForArray(data, type);
                    if (entities) {
                        var target = null;
                        for (var i = 0; i < entities.length; i++) {
                            var entity = entities[i];
                            if (entity && entity[key] == id) {
                                entities.splice(i, 1);
                                target = entity;
                                break;
                            }
                        }
                        resolve(JSON.parse(JSON.stringify(target)));
                    }
                    else {
                        reject('Entity type "' + type + '" not found.');
                    }
                });
            },
        };
        return theService;
    }])
    ;
