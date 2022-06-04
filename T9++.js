import { ExponentialCost, FirstFreeCost } from "../api/Costs";
import { Localization } from "../api/Localization";
import { parseBigNumber, BigNumber } from "../api/BigNumber";
import { theory } from "../api/Theory";
import { Utils } from "../api/Utils";

var id = "t9++"
var name = "Theory Dilemmas";
var description = "An expansion to the 'Convergence Test' theory which contains lemmas that contribute a small amount to tau.";
var authors = "Gaunter#7599 - Framework design";
var version = "1.0";

currency = theory.createCurrency();

// Decouples main theory currency from tau gain
var rho = BigNumber.ONE;
var c1, c2;
var scoreExponent;
var scoreExponentScale = 0.15;
var activeChallenge = 0;
var unlockNextChallenge;
var challengeBar, challengeBarTau, challengeBarCurrency, challengeCompletionButton, exitChallengeButton;
var tauExponent = 0.5;

class Variable{
    constructor(latexSymbol, initialValue){
        this.latexSymbol = latexSymbol;
        this.initialValue = initialValue;
        this.value = initialValue;
    }
}
class Challenge {
    constructor(id, score, isUnlocked, completionRequirement, primaryEquation, secondaryEquation, tertiaryEquation, calculateScore, tickFunction, upgrades, internalVars) {
        this.id = id;
        this.score = score;
        this.isUnlocked = isUnlocked;
        this.completionRequirement = completionRequirement;
        this.challengeCurrency = BigNumber.ONE;
        this.primaryEquation = primaryEquation;
        this.secondaryEquation = secondaryEquation;
        this.tertiaryEquation = tertiaryEquation;
        this.calculateScore = calculateScore;
        this.tick = eval(tickFunction);
        this.getUpgradeValue = [];
        this.upgrades = [];
        if(upgrades){
            for (const upgrade of upgrades) {
                this.getUpgradeValue[upgrade.internalId] = upgrade.getValue;
                this.upgrades[upgrade.internalId] = upgradeFactory(this.id, upgrade);
            }
        }
        this.internalVars = internalVars;
    }

    getScore() {
        return this.score;
    }

    getCurrency() {
        return this.challengeCurrency;
    }

    getPrimaryEquation() {
        return this.primaryEquation;
    }

    getSecondaryEquation() {
        return this.secondaryEquation;
    }

    getTertiaryEquation() {
        let tertiaryEquation = "";
        if(this.internalVars){
        for (const internalVar of this.internalVars) {
            tertiaryEquation += internalVar.latexSymbol + " = " + internalVar.value + "\\ ";
        }
    }
        return tertiaryEquation;
    }
    getCompletionRequirement() {
        return this.completionRequirement;
    }

    setInternalVar(index, value){
        this.internalVars[index] = value;
    }

    setInternalVars(values){
        let index = 0;
        for (const value of values) {
            this.internalVars[index].value = parseBigNumber(value);
        }
    }

    completeChallenge(){
        this.score = this.calculateScore();
        this.resetUpgrades();
    }

    exitChallenge(){
        this.score = this.calculateScore();
        this.resetUpgrades();
    }

    resetUpgrades(){
        this.challengeCurrency = BigNumber.ONE;
        for (const upgrade of this.upgrades) {
            upgrade.isAvailable = false;
            upgrade.level = 0;
        }
        if(this.internalVars){
        for(const internalVar of this.internalVars){
            internalVar.value = internalVar.initialValue;
        }
    }
        activeChallenge = 0;
        theory.invalidatePrimaryEquation();
        theory.invalidateSecondaryEquation();
    }

    updateAvailability() {
        for (const upgrade of this.upgrades) {
            if(activeChallenge == this.id){
                upgrade.isAvailable = true;
            }
            else{
                upgrade.isAvailable = false;
            }
        }
    }
}

// Takes an upgrade within a challenge object and converts it into a purchasable theory upgrade
var upgradeFactory = (challengeId, upgrade) => {
    let temp = theory.createUpgrade(100*challengeId + upgrade.internalId, currency, upgrade.costModel);
    temp.getDescription = upgrade.description;
    temp.getInfo = upgrade.info;
    // Any new upgrades defined this way will be set to false by default and will be available only when the challenge is active
    temp.isAvailable = false;
    if (upgrade.maxLevel) temp.maxLevel = upgrade.maxLevel;
    return temp;
}

var challengeList = [
    new Challenge(1, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge One}", "\\dot{\\rho} = qr, \\dot{q} = 1, \\dot{r} = 2", "", () => {return BigNumber.from(1e10)},
    // Challenge 1 Tick Function
    "(function (elapsedTime, multiplier) { \n \
        this.internalVars[0].value += 1; \n \
        this.internalVars[1].value += 2; \n \
        this.challengeCurrency += this.internalVars[0].value * this.internalVars[1].value; \n \
    })", [{
        // Internal id can be any number between 0 and 99 inclusive
        internalId: 0,
        costModel: new FirstFreeCost(new ExponentialCost(10, Math.log2(1))),
        getValue: (level) => {
            return ( level );
        },
        description: (amount) => Utils.getMath(challengeList[0].getUpgradeValue[0](challengeList[0].upgrades[0].level)),
        info: (amount) => Utils.getMathTo(challengeList[0].getUpgradeValue[0](challengeList[0].upgrades[0].level), challengeList[0].getUpgradeValue[0](challengeList[0].upgrades[0].level + amount)),
    }], 
    // new Variable(latexSymbol, initialValue)
    [new Variable("q", BigNumber.ONE), new Variable("r", BigNumber.ONE)]
    ),
    new Challenge(2, BigNumber.ONE, true, BigNumber.from(1e20), "\\text{Challenge Two}", "\\dot{\\rho} = 2", "", () => {return BigNumber.from(1e10)}, 
    // Challenge 2 Tick Function
    "(function (elapsedTime, multiplier) { \n \
        this.challengeCurrency += 2; \n \
    })"), 
    new Challenge(3, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge Three}", "\\dot{\\rho} = 3", "",  () => {return BigNumber.from(1e10)},
    // Challenge 3 Tick Function
    "(function (elapsedTime, multiplier) { \n \
        this.challengeCurrency += 3; \n \
    })"),    
    new Challenge(4, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge Four}", "\\dot{\\rho} = 4", "",  () => {return BigNumber.from(1e10)},
    // Challenge 4 Tick Function 
    "(function (elapsedTime, multiplier) { \n \
        this.challengeCurrency += 4; \n \
    })"),
    new Challenge(5, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge Five}", "\\dot{\\rho} = 5", "",  () => {return BigNumber.from(1e10)},
    // Challenge 5 Tick Function
    "(function (elapsedTime, multiplier) { \n \
        this.challengeCurrency += 5; \n \
    })"),
];

var init = () => {
    ///////////////////
    // Milestones

    theory.setMilestoneCost(new CustomCost((total) => BigNumber.from(getMileStoneRoute(total))));
    // Score multiplier exponent
    {
        scoreExponent = theory.createMilestoneUpgrade(0, 2);
        scoreExponent.getDescription = (_) => Localization.getUpgradeIncCustomExpDesc("\\prod \\lambda_i", scoreExponentScale);  
        scoreExponent.getInfo = (_) => Localization.getUpgradeIncCustomExpInfo("\\prod \\lambda_i", scoreExponentScale);
        scoreExponent.boughtOrRefunded = (_) =>  updateAvailability(); theory.invalidatePrimaryEquation(); 
    }

    ///////////////////
    // Main Equation Upgrades

    // q1
    {
        let getDesc = (level) => "c_1=" + getC1(level).toString(0);
        let getInfo = (level) => "c_1=" + getC1(level).toString(0);
        c1 = theory.createUpgrade(1, currency, new FirstFreeCost(new ExponentialCost(10, Math.log2(1.61328))));
        c1.getDescription = (amount) => Utils.getMath(getDesc(c1.level));
        c1.getInfo = (amount) => Utils.getMathTo(getInfo(c1.level), getInfo(c1.level + amount));
    }

    // q2
    {
        let getDesc = (level) => "c_2=2^{" + level + "}";
        let getInfo = (level) => "c_2=" + getC2(level).toString(0);
        c2 = theory.createUpgrade(2, currency, new ExponentialCost(15, Math.log2(8)));
        c2.getDescription = (amount) => Utils.getMath(getDesc(c2.level));
        c2.getInfo = (amount) => Utils.getMathTo(getInfo(c2.level), getInfo(c2.level + amount));
    }

    /////////////////////
    // Permanent Upgrades
    theory.createPublicationUpgrade(0, currency, 1e7);
    theory.createBuyAllUpgrade(1, currency, 1e10);
    theory.createAutoBuyerUpgrade(2, currency, 1e30);

    unlockNextChallenge = theory.createPermanentUpgrade(3, currency, new CustomCost((level) => BigNumber.TEN.pow(level*20)));
    unlockNextChallenge.getDescription = (_) => "Unlock Next Challenge";
    unlockNextChallenge.getInfo = (_) => "Unlock Next Challenge";
    unlockNextChallenge.maxLevel = 5;

    updateAvailability();
}

var updateAvailability = () => {
}

var calculateScoreMultiplier = () => {
    let totalScore = BigNumber.ZERO;
    // While in development, we will mock the score
    if (false){
        for (let challenge of challengeList) {
            totalScore *= challenge.getScore();
        }    
    }
    else{
        totalScore = BigNumber.TEN.pow(30) // BigNumber.TEN.pow(unlockNextChallenge.level * 5);
    }
    return totalScore;
}
var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime * multiplier);
    let bonus = theory.publicationMultiplier * calculateScoreMultiplier().pow(1 + scoreExponent.level*scoreExponentScale);
    let vc1 = getC1(c1.level);
    let vc2 = getC2(c2.level);
    updateAvailability();
    if (activeChallenge == 0) {
        rho = currency.value;
        rho += bonus * vc1 * vc2 * dt;    
        currency.value = rho;
    }
    else {
        challengeList[activeChallenge - 1].challengeCurrency = currency.value;
        challengeList[activeChallenge - 1].tick(elapsedTime, multiplier);
        currency.value = challengeList[activeChallenge - 1].getCurrency();
    }

    challengeBarTau.text = Utils.getMath(theory.tau + theory.latexSymbol);
    challengeBarCurrency.text = Utils.getMath(currency.value.toString() + "\\rho");
    exitChallengeButton.isVisible = (activeChallenge != 0);
    challengeCompletionButton.isVisible = (activeChallenge > 0 && challengeList[activeChallenge - 1].getCurrency() >= (challengeList[activeChallenge - 1].getCompletionRequirement()));
    theory.invalidatePrimaryEquation();
    theory.invalidateTertiaryEquation();
}

var startChallenge = (id) => {
    activeChallenge = id;
    currency.value = challengeList[id - 1].getCurrency();
    challengeList[id - 1].updateAvailability();
    theory.invalidatePrimaryEquation();
    theory.invalidateSecondaryEquation();
}

// UI

// challenge object JSON format:
// challenge = {
//   id: int,
//   score: float, 
//   isUnlocked: bool,
//}
populateChallengeMenu = (challenges) => {
    let menuItems = [];
    for (const challenge of challenges) {
        if(challenge.isUnlocked) {
            menuItems.push(
            ui.createGrid({
               columnDefinitions: ["20*", "30*", "auto"],
                  children: [
                     ui.createLatexLabel({text: Utils.getMath("\\lambda_"+ challenge.id + "= " + challenge.score.toString()), horizontalOptions: LayoutOptions.CENTER, verticalOptions: LayoutOptions.CENTER}),
                     ui.createButton({text: "Start Challenge", onClicked: () => { startChallenge(challenge.id)}, row: 0, column: 1 }), 
                  ]
            }));
        }
    }

    return menuItems;
}
var createChallengeMenu = () => {
    let menu = ui.createPopup({
        title: "Dilemmas",
        content: ui.createStackLayout({
            children: populateChallengeMenu(challengeList),
        })
    }
    )

    return menu;
}

var updateAvailability = () => {
    c1.isAvailable = (activeChallenge == 0);
    c2.isAvailable = (activeChallenge == 0);
    for (let challenge of challengeList) {
        if(challenge.upgrades.length > 0) {
            challenge.updateAvailability()
        };
    }
}

var  getCurrencyBarDelegate = () => {
    challengeBar = ui.createGrid({
        columnDefinitions: ["20*", "30*", "auto"],
        children: [
            challengeBarTau = ui.createLatexLabel({
                text: Utils.getMath(theory.tau + theory.latexSymbol),
                row: 0,
                column: 0,
                horizontalOptions: LayoutOptions.CENTER,
                verticalOptions: LayoutOptions.CENTER,
            }),
            challengeBarCurrency = ui.createLatexLabel({
                text: Utils.getMath(currency.value.toString() + "\\rho"),
                row: 0,
                column: 1,
                horizontalOptions: LayoutOptions.CENTER,
                verticalOptions: LayoutOptions.CENTER,
            }),
            exitChallengeButton = ui.createButton({
                text: "Exit Challenge",
                onClicked: () => {challengeList[activeChallenge - 1].exitChallenge();},
                row: 1,
                column: 0,
                horizontalOptions: LayoutOptions.CENTER,
                verticalOptions: LayoutOptions.CENTER,
            }),
            challengeCompletionButton = ui.createButton({
                text: "Complete Challenge",
                onClicked: () => {challengeList[activeChallenge - 1].completeChallenge();},
                row: 1,
                column: 1,
                horizontalOptions: LayoutOptions.CENTER,
                verticalOptions: LayoutOptions.CENTER,
            })
        ],
    });
    return challengeBar;
}

var goToNextStage = () => {
    var challengeMenu = createChallengeMenu();
    challengeMenu.show();
};

var canGoToNextStage = () => activeChallenge == 0;

class ChallengeData {
    constructor(score, isUnlocked, challengeCurrency, internalVars) {
        this.score = score.toString();
        this.isUnlocked = isUnlocked.toString();
        this.challengeCurrency = challengeCurrency.toString();

        // Saves the value of each internal variable within each challenge as a string array
        this.internalVars = [];
        for (let internalVar in internalVars) {
            if (internalVar.value) this.internalVars.push(internalVar.value.toString());
        }
    }
}

var serialiseChallengeData = () => {
    let challengeData = [];
    for (let challenge of challengeList) {
        challengeData.push(new ChallengeData(challenge.score, challenge.isUnlocked, challenge.challengeCurrency, challenge.internalVars));
    }
    return JSON.stringify(challengeData);
}

var deserialiseChallengeData = (data) => {
    let challengeData = JSON.parse(data);
    let index = 0;
    if (challengeData) for (let data of challengeData) {
        challengeList[index].score = parseBigNumber(data.score);
        challengeList[index].isUnlocked = data.isUnlocked == "true";
        challengeList[index].challengeCurrency = parseBigNumber(data.challengeCurrency);
        if(data.internalVars) challengeList[index].setInternalVars(data.internalVars);
        index++;
    }
}

var getInternalState = () => `${serialiseChallengeData()} ${rho} ${activeChallenge}`;

var setInternalState = (state) => {
    let values = state.split(" ");
    if (values.length > 0) deserialiseChallengeData(values[0]);
    if (values.length > 1) rho = parseBigNumber(values[1]);
    if (values.length > 2) activeChallenge = parseInt(values[2]);
}

var postPublish = () => {
    q = BigNumber.ONE;
    rho = BigNumber.ONE;
}

var getPrimaryEquation = () => {
    let scoreExponentText = scoreExponent.level >= 1 ? "( \\prod \\lambda_i ) ^{"+ (1 + scoreExponent.level*scoreExponentScale).toString() + "}" : "\\prod \\lambda_i";
    theory.primaryEquationHeight = 55;

    if (activeChallenge == 0) {
    result = "\\dot{\\rho}=c_1 c_2 " + scoreExponentText;
    }
    else{
        result = challengeList[activeChallenge - 1].getPrimaryEquation();
    }

    return result;
}
var getSecondaryEquation = () => {
    if (activeChallenge == 0) {
        return theory.latexSymbol + "=\\max\\rho^{" + tauExponent +"}";
    }
    else{
        return challengeList[activeChallenge - 1].getSecondaryEquation();
    }
}
var getTertiaryEquation = () => {
    if (activeChallenge == 0) {
        return "\\prod \\lambda_i \\ =" + calculateScoreMultiplier().toString();
    }
    else{
        return challengeList[activeChallenge - 1].getTertiaryEquation();
    }
}
var getMileStoneRoute = (level) => {
    let result = 1
    switch(level) {
        case 0: result = tauExponent * 40; break;
        case 1: result = tauExponent * 110; break;
    }
    return result;
}
var getPublicationMultiplier = (tau) => tau.pow(0.15/tauExponent);
var getPublicationMultiplierFormula = (symbol) => "{" + symbol + "}^{"+ 0.15/tauExponent +"}";
var getTau = () => rho.pow(tauExponent);
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();
var getCurrencyFromTau = (tau) => [tau.max(BigNumber.ONE).pow(1/tauExponent), currency.symbol];
var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getC2 = (level) => BigNumber.TWO.pow(level);
init();
