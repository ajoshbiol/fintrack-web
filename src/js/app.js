var app = angular.module('Fintrack', ['ngMaterial', 'ngMessages']);

var accounts = [];
var categories = [];
var categoriesMap = {};
var classifications = ["Essential", "Personal", "Savings", "Income"]

// Function to call to init reused variables
function init($scope, $http) {
    $scope.pageSize = 10;
    $scope.lastTs = null;
    $scope.lastId = null;

    // Get categories
    $http({
        method : 'GET',
        url : serviceUrl + "/categories"
    })
    .then(function success(response) {
        response.data.categories.forEach(function(item, index) {
            categories.push(item._source.category);
            categoriesMap[item._source.category] = item._source.subcategory;
        });
    }, function error(response) {
        console.error(response);
    });

    // Get accounts
    $http({
        method : 'GET',
        url : serviceUrl + "/accounts"
    })
    .then(function success(response) {
        response.data.accounts.forEach(function(item, index) {
            accounts.push(item._source.name);
        });
    }, function error(response) {
        console.error(response);
    });
}

// Helper function to refresh transactions
function refreshTransactions($scope, $http) {
    console.log('calling refresh transaction');
    getTransactions($http, $scope.pageSize, $scope.lastTs, $scope.lastId, 
        function (err, transactions) {

        if (err) {
            console.error(err);
        } 

        $scope.transactions = transactions;
    });
}

// Main controller for cards in the Interests section
app.controller('TransactionsCtrl', ['$scope', '$http', '$interval', 
    '$mdDialog', function($scope, $http, $interval, $mdDialog) {

    init($scope, $http);
    refreshTransactions($scope, $http);

    $scope.showTransactionDialog = showTransactionDialog; 

    function showTransactionDialog(ev, transaction) {
        $scope.selTransaction = transaction;

        $mdDialog.show({
            controller: DialogController,
            templateUrl: './html/transactionDialog.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: false,
            scope: $scope,
            preserveScope: true
        })
        .then(function(transaction) {
            console.log(transaction);
            if ('id' in transaction) {
                // edit a transaction
                if ($scope.deleteTransaction) {
                    console.log('DELETE'); 
                    deleteTransaction($http, transaction.id, function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        console.log(data);
                        // Confirmation message
                        refreshTransactions($scope, $http);
                    });
                }
            }
            else {
                addTransaction($http, transaction, function(err, data) {
                    if (err) {
                        console.error(err);
                    }
                    console.log(data);
                    // Confirmation message
                    refreshTransactions($scope, $http);
                });
            }
        }, function() {
            console.log('Exit Dialog');
            $scope.selTransaction = null;
            $scope.currTransaction = null;
        });
    }

    function DialogController($scope, $mdDialog) {
        if ($scope.selTransaction == null) {
            $scope.title = 'Add Transaction';
            $scope.action = 'Create';
            $scope.currTransaction = {
                'date' : null,
                'category' : null,
                'subcategory' : null,
                'description' : null,
                'classification': null,
                'account' : null,
                'value' : null
            };
        }
        else {
            $scope.title = 'Edit Transaction'
            $scope.action = 'Edit';
            $scope.currTransaction = {
                'date' : $scope.selTransaction._source.date,
                'category' : $scope.selTransaction._source.category,
                'subcategory' : $scope.selTransaction._source.subcategory,
                'description' : $scope.selTransaction._source.description,
                'classification' : $scope.selTransaction._source.classification,
                'account' : $scope.selTransaction._source.account,
                'value' : $scope.selTransaction._source.value,
                'id' : $scope.selTransaction._id
            };
        }

        $scope.accounts = accounts; 
        $scope.categories = categories;
        $scope.classifications = classifications;

        $scope.getSubcategories = function() {
            $scope.subcategories = categoriesMap[$scope.currTransaction.category];
        };

        if ($scope.currTransaction.category != null) {
            $scope.getSubcategories();
        }

        $scope.cancel = function() {
            console.log($scope.input);
            $mdDialog.cancel();
        }

        $scope.submitTransaction = function() {
            $mdDialog.hide($scope.currTransaction); 
            $scope.selTransaction = null;
            $scope.currTransaction = null;
        }

        $scope.deleteTransaction = function() {
            $scope.deleteTransaction = true;
            $mdDialog.hide($scope.currTransaction); 
        }
    }
}]);

// Function to add a transaction
function addTransaction($http, transaction, callback) {
    $http({
        method : 'POST',
        url : serviceUrl + '/transactions',
        data: transaction,
        headers: {'Content-Type': 'application/json'}
    })
    .then(function success(response) {
        return callback(null, response);
    }, function error(response) {
        return callback(response);
    });
}

// Function to delete a transaction
function deleteTransaction($http, id, callback) {
    $http({
        method : 'DELETE',
        url : serviceUrl + '/transactions?ids=' + id
    })
    .then(function success(response) {
        return callback(null, response);
    }, function error(response) {
        return callback(response);
    });
}

// Function to retrieve transactions from Fintrack service
function getTransactions($http, size, ts, id, callback) {

    var query = "?size=" + size;
    if (ts !== null && id !== null) {
        query += "&ts=" + ts + "&id=" + id;
    }
    $http({
        method : 'GET',
        url : serviceUrl + '/transactions' + query
    })
    .then(function success(response) {
        return callback(null, response.data.transactions);
    }, function error(response) {
        return callback(response);
    });
}

// Function to edit a transaction
function editTransaction($scope, $http, transaction, callback) {
    //console.log(transaction);
}
