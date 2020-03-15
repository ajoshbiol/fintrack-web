var app = angular.module('Fintrack', ['ngMaterial', 'ngMessages']);

var accounts = [];
var categories = [];
var subcategories = [];
var classifications = ["Essential", "Personal", "Savings", "Income"]
var markers = [];

// Function to call to init reused variables
function init($scope, $http) {
    $scope.currPage = null;
    $scope.pageSize = 10;

    // Get categories
    $http({
        method : 'GET',
        url : serviceUrl + "/categories"
    })
    .then(function success(response) {
        let c = new Set();
        response.data.categories.forEach(function(item) {
            c.add(item._source.category);
            item._source.subcategory.forEach(function(subcategory) {
                var temp = {
                    'category' : item._source.category,
                    'name' : subcategory
                };
                subcategories.push(temp);
            });
        });
        categories = Array.from(c);
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

function getNextTransactions($scope, $http) {
    var marker = null;
    if ($scope.currPage !== null || $scope.currPage > 0) {
       marker = markers[$scope.currPage]; 
    }

    getTransactions($http, $scope.pageSize, marker, 
        function (err, transactions) {

        if (err) {
            console.error(err);
        } 
        else {
            $scope.transactions = transactions;
            if ($scope.currPage !== null) {
                $scope.currPage++;
            }
            else {
                $scope.currPage = 0;
            }
            if (markers[$scope.currPage] == undefined) {
                markers.push(transactions[transactions.length - 1]);
            }
        }
    });
}

function getPrevTransactions($scope, $http) {
    var marker = null;
    if ($scope.currPage > 1) {
       marker = markers[$scope.currPage - 2]; 
    }

    getTransactions($http, $scope.pageSize, marker, 
        function (err, transactions) {

        if (err) {
            console.error(err);
        } 
        else {
            $scope.transactions = null;
            $scope.transactions = transactions;
            if ($scope.currPage > 0) {
                $scope.currPage--;
            }
        }
    });
}

// Main controller for cards in the Interests section
app.controller('TransactionsCtrl', ['$scope', '$http', '$interval', 
    '$mdDialog', function($scope, $http, $interval, $mdDialog) {

    init($scope, $http);
    getNextTransactions($scope, $http);

    $scope.getNextTransactions = function() {
        getNextTransactions($scope, $http);
    }

    $scope.getPrevPageTransactions = function() {
        getPrevTransactions($scope, $http);
    }

    $scope.showTransactionDialog = showTransactionDialog; 

    function showTransactionDialog(ev, transaction) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: './html/transactionDialog.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: false,
            locals: {
                transaction : transaction
            }
        })
        .then(function(data) {
            if (data.delete) {
                deleteTransaction($http, data.transaction.id, function(err, response) {
                    if (err) {
                        console.error(err);
                    }
                    // Confirmation message
                    refreshTransactions($scope, $http);
                });
            }
            else {
                upsertTransaction($http, data.transaction, function(err, response) {
                    if (err) {
                        console.error(err);
                    }
                    // Confirmation message
                    refreshTransactions($scope, $http);
                });
            }
        }, function() {
            console.log('Exit Dialog');
        });
    }

    function DialogController($scope, $mdDialog, transaction) {
        $scope.accounts = accounts; 
        $scope.classifications = classifications;
        $scope.categories = categories;
        $scope.subcategories = subcategories;

        if (!transaction) {
            $scope.title = 'Add Transaction';
            $scope.action = 'Create';
            $scope.transaction = {
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
            $scope.action = 'Save';
            $scope.transaction = {
                'date' : transaction._source.date,
                'category' : transaction._source.category,
                'subcategory' : transaction._source.subcategory,
                'description' : transaction._source.description,
                'classification' : transaction._source.classification,
                'account' : transaction._source.account,
                'value' : transaction._source.value,
                'id' : transaction._id
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        }

        $scope.submitTransaction = function() {
            var temp = {
                'transaction' : $scope.transaction,
                'delete' : false
            }
            $mdDialog.hide(temp); 
        }

        $scope.deleteTransaction = function() {
            var temp = {
                'transaction' : $scope.transaction,
                'delete' : true
            }
            $mdDialog.hide(temp); 
        }
    }
}]);

// Function to upsert a transaction
function upsertTransaction($http, transaction, callback) {
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
function getTransactions($http, size, last, callback) {

    var query = "?size=" + size;
    if (last !== null) {
        query += "&ts=" + last.sort[0] + "&id=" + last.sort[1];
    }
    console.log(query);
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
