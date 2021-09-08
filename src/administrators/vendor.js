//inter-room resource sharing and market manager
class Vendor {
    constructor() {
        this.balances = {};
        this.surpluses = {};
        this.shortages = {};

        this.resources = [
            "storage_energy",
            RESOURCE_ENERGY,
            RESOURCE_HYDROGEN,
            RESOURCE_OXYGEN,
            RESOURCE_UTRIUM,
            RESOURCE_LEMERGIUM,
            RESOURCE_KEANIUM,
            RESOURCE_ZYNTHIUM,
            RESOURCE_CATALYST
        ]

        this.numTerminalResources = 8;

        for (let res of this.resources) {
            this.surpluses[res] = [];
            this.shortages[res] = [];
        }
    }

    /**
     * Method that documents the entire dominion
     */
    appraise() {
        for (let room of global.Imperator.dominion) {
            this.document(room);
        }
    }
    
    /**
     * Method that documents the market status of a room
     * @param {String} room 
     */
    document(room) {
        let liveRoom = Game.rooms[room];
        if (!liveRoom || !liveRoom.terminal || !liveRoom.terminal.my) return false;
        this.balances[room] = {};
        //iterate through all resources of note
        for (let res of this.resources) {
            //check to how much of that resource the room has, minus the amount currently selling and plus the amount buying
            let sellOrders = _.filter(Game.market.orders, order => order.roomName == room && order.type == ORDER_SELL && order.resourceType == res);
            let sellAmount = 0;
            for (let order of sellOrders) {
                sellAmount += order.amount;
            }
            let buyOrders = _.filter(Game.market.orders, order => order.roomName == room && order.type == ORDER_BUY && order.resourceType == res);
            let buyAmount = 0;
            for (let order of buyOrders) {
                buyAmount += order.amount;
            }

            let multiplier = 1;
            //triple the requirement for the room's own mineral type
            if (res === "storage_energy") {
                this.balances[room][res] = -this.getTarget(res) + liveRoom.storage.store[RESOURCE_ENERGY];
            } else {
                if (liveRoom.find(FIND_MINERALS)[0].mineralType == res) multiplier = 3;
                this.balances[room][res] = -this.getTarget(res) * multiplier + liveRoom.terminal.store[res] - sellAmount + buyAmount;
            }
            
            //if it is higher than the target by an extra tenth of the target
            if (this.balances[room][res] > this.getTarget(res) / 10) {
                //add to array if it hasn't already been added
                if (this.surpluses[res].indexOf(room) < 0) {
                    this.surpluses[res].push(room);
                }
                //remove from the opposite array
                let index = this.shortages[res].indexOf(room);
                if (index >= 0) this.shortages[res].splice(index, 1);

            //if it is lower than the target, add it to the shortages list
            } else if (this.balances[room][res] < 0) {
                if (this.shortages[res].indexOf(room) < 0) {
                    this.shortages[res].push(room);
                }
                let index = this.surpluses[res].indexOf(room);
                if (index >= 0) this.surpluses[res].splice(index, 1);
            }
        }
        return true;
    }

    /**
     * Method to buy resources that are needed if they are not available from other rooms
     * @param {String} room 
     */
    requisition(room) {
        //first check if this room has any shortages
        let needs = this.getNeeds(room);
        if (needs.length == 0) return false;

        //energy data for transfer costs
        let energyData = this.getTwoWeekAverages(RESOURCE_ENERGY);
        let energyPrice = energyData.avgPrice;

        //loop through all needs
        for (let res of needs) {
            if (this.surpluses[res].length > 0) continue;
            //the balance of a need is negative, so lets make it positive
            let need = -this.balances[room][res];
            if (need > 1000) {
                let marketInfo = this.getTwoWeekAverages(res);
                let sellOrders = Game.market.getAllOrders({type: ORDER_SELL, resourceType: res});
                let targetPrice = (marketInfo["avgPrice"] * 1.15).toFixed(3); //maybe include marketInfo["stddevPrice"]

                let sortedOrders = [];
                for (let order of sellOrders) {
                    //include energy transfer cost in price
                    let totalPrice = (need * order.price) + (energyPrice * Game.market.calcTransactionCost(need, room, order.roomName));
                    let totalPricePerUnit = totalPrice / need;

                    sortedOrders.push({
                        "id": order.id,
                        "price": totalPricePerUnit,
                        "amount": order.amount,
                        "room": order.roomName
                    })
                }
                sortedOrders.sort((a, b) => a.price - b.price);
                

                let cheapestOrder = sortedOrders[0];
                if (cheapestOrder.price < targetPrice) {
                    //if the immediate buy is cheaper than the making a buy order, do it
                    let amount = Math.min(cheapestOrder.amount, need);
                    let success = Game.market.deal(cheapestOrder.id, amount, room);

                    if (success == OK) {
                        this.balances[room][res] += amount;
                        if (this.balances[room][res] >= 0) {
                            let index = this.shortages[res].indexOf(room);
                            if (index >= 0) this.shortages[res].splice(index, 1);
                        }
                        this.balances[room][RESOURCE_ENERGY] -= Game.market.calcTransactionCost(amount, room, cheapestOrder.room);
                        return true;
                    }
                } else {
                    //sell orders aren't cheap enough, create a buy order
                    let success = Game.market.createOrder({
                        type: ORDER_BUY,
                        resourceType: res,
                        price: targetPrice,
                        totalAmount: need,
                        roomName: room   
                    });

                    if (success == OK) {
                        this.balances[room][res] = 0;
                        //remove from the surpluses list and reset balances
                        let index = this.shortages[res].indexOf(room);
                        if (index >= 0) this.shortages[res].splice(index, 1);
                        return true;
                    }
                }
                
            }
        }
    }

    /**
     * Method to send resources to other rooms
     * @param {String} room 
     */
    relinquish(room) {
        //first check if this this room has any surpluses
        let excess = this.getExcess(room);
        if (excess.length == 0) return false;

        //check all the shortages for the excess resources we have and send the resource to that room
        for (let res of excess) {
            let shorts = this.shortages[res];
            if (shorts.length == 0) continue;
            let targetRoom = shorts[0];
            let amountAvailable = this.balances[room][res];
            let amountNeeded = -this.balances[targetRoom][res];
            let amountToSend = Math.min(amountNeeded, amountAvailable);
            let result = Game.rooms[room].terminal.send(res, amountToSend, targetRoom, 
                "Routine supplies shipment of " + res + " from " + room + " to " + targetRoom);
            
            if (result == OK) {
                //remove targetRoom from the shortages list and reset balances
                this.balances[targetRoom][res] += amountToSend;
                if (this.balances[targetRoom][res] >= 0) {
                    let index = this.shortages[res].indexOf(targetRoom);
                    if (index >= 0) this.shortages[res].splice(index, 1);
                }

                //remove sender room from surpluses list and adjust balances
                this.balances[room][res] -= amountToSend;
                if (this.balances[room][res] <= 0) {
                    let index = this.surpluses[res].indexOf(room);
                    if (index >= 0) this.surpluses[res].splice(index, 1);
                }

                return true;
            }
        }
    }

    /**
     * Method to list excess resources on the market
     * @param {String} room 
     */
    merchandise(room, resources=undefined) {
        //check if the room has any surpluses
        if (resources === undefined) resources = this.getExcess(room);
        if (resources.length == 0) return false;

        for (let res of resources) {
            if (res !== RESOURCE_ENERGY && this.shortages[res].length > 0) continue;
            let surplus = this.balances[room][res];
            if (res == RESOURCE_ENERGY) {
                let storageSurplus = this.balances[room]["storage_energy"];
                if (storageSurplus > 50000 && surplus >= 0) {
                    surplus = 50000;
                }
            }
            if (surplus > 5000) {
                let marketInfo = this.getTwoWeekAverages(res);
                let price = (marketInfo["avgPrice"] * 0.85).toFixed(3);
                let success = Game.market.createOrder({
                    type: ORDER_SELL,
                    resourceType: res,
                    price: price,
                    totalAmount: surplus,
                    roomName: room   
                });

                if (success == OK) {
                    //remove from the surpluses list and reset balances
                    let index = this.surpluses[res].indexOf(room);
                    if (index >= 0) this.surpluses[res].splice(index, 1);
                    this.balances[room][res] -= surplus;
                }
            }
        }
    }

    /**
     * Method that clears old outdated buy and sell order
     * @param {String} room 
     */
    clean(delAll = false) {
        let allOrders = Game.market.orders;
        for (let id in allOrders) {
            let order = allOrders[id];
            //cancel any orders with no more left to sell or that are too old
            if (delAll || order.amount == 0 || Game.time - order.created > 50000) {
                Game.market.cancelOrder(order.id);
                this.balances[order.roomName][order.resourceType] += order.remainingAmount;
            }
        }
    }

    /**
     * Method to print off a table of every room and their current balances
     */
    printBalances() {
        let result = "<style> .balanceTable {border: 1px solid black; padding: 5px; text-align: center; color: black; background-color: #7d7d7dm;} </style>\
        <table style='width:200%' class='balanceTable'>\
        <caption>Resource Balances for Owned Rooms</caption>\
        <tr><th class='balanceTable'>Room</th>";
        for (let res of this.resources) {
            result += `<th class='balanceTable'>${res}</th>`;
        }
        result += "</tr>";
        for (let room in this.balances) {
            result += `<tr class='balanceTable'>` +
                `<td class='balanceTable'>${room}</td>`;
            for (let res in this.balances[room]) {
                let color = 'white';
                if (this.balances[room][res] > this.getTarget(res) / 10) {
                    color = 'green';
                } else if (this.balances[room][res] < 0) {
                    color = 'red';
                }
                result += `<td class='balanceTable' style="background-color:${color}">${this.balances[room][res]}</td>`;
            }
            result += `</tr>`;
        }
        result += "</table>";
        console.log(result);
    }

    getTwoWeekAverages(resource) {
        let fourteenDays = Game.market.getHistory(resource);

        let averages = [];
        let stddev = [];
        //loop through the last 14 days
        for (let day of fourteenDays) {
            averages.push(day.avgPrice);
            stddev.push(day.stddevPrice);
        }

        //remove outliers
        let resultArray = [];
        for (let array of [averages, stddev]) {
            //sort the array highest to lowest
            array.sort( function(a, b) {
                return a - b;
            });
            //calculate the 1st quarter
            let q1 = array[Math.floor(array.length / 4)];
            //calculate the 3rd quarter
            let q3 = array[Math.floor(array.length * (3/4))];
            let iqr = q3-q1;

            let minValue = q1 - iqr * 1.5;
            let maxValue = q3 + iqr * 1.5;

            resultArray.push(array.filter(x =>
                (x <= maxValue) && (x >= minValue)
            ));
        }

        let sevenDays = {
            "avgPrice": resultArray[0].reduce((a, b) => a + b, 0) / resultArray[0].length,
            "stddevPrice": resultArray[1].reduce((a, b) => a + b, 0) / resultArray[1].length
        }
        return sevenDays;
    }

    /**
     * Method that returns the target number of a resource
     * @param {String} resourceType 
     * @returns Target number of resource in the terminal
     */
    getTarget(resourceType) {
        switch (resourceType) {
            case RESOURCE_ENERGY:
                return 50000;
            case "storage_energy":
                return 350000;
            default:
                return 10000;
        }
    }

    /**
     * Method that returns the minerals that a room has excess of
     * @param {String} room 
     * @returns Array containing resources that the room has excess of
     */
    getExcess(room) {
        let excess = [];
        for (let res in this.surpluses) {
            if (this.surpluses[res].includes(room)) {
                if (res === "storage_energy" && !excess.includes(RESOURCE_ENERGY)) {
                    excess.push(RESOURCE_ENERGY);
                    continue;
                }
                excess.push(res);
            }
        }
        return excess;
    }

    /**
     * Method that returns the minerals that a room has need of
     * @param {String} room 
     * @returns Array containing resources that the room has need of
     */
    getNeeds(room) {
        let needs = [];
        for (let res in this.shortages) {
            if (res !== RESOURCE_ENERGY && this.shortages[res].includes(room)) {
                needs.push(res);
            }
        }
        return needs;
    }
}

module.exports = Vendor;