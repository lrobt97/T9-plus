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

var q = BigNumber.ONE;
var q1, q2;
var activeChallenge = 0;
class Challenge {
    constructor(id, score, isUnlocked, isActive, isCompleted, completionRequirement, equation) {
        this.id = id;
        this.score = score;
        this.isUnlocked = isUnlocked;
        this.isActive = isActive;
        this.isCompleted = isCompleted;
        this.completionRequirement = completionRequirement;
        this.challengeCurrency = BigNumber.ONE;
        this.equation = equation;
    }

    getCurrency() {
        return this.challengeCurrency;
    }

    getEquation() {
        return this.equation;
    }
}

var challengeList = [
    new Challenge(1, BigNumber.ONE, true, false, false, BigNumber.ONE, "\\text{Challenge One}"),
    new Challenge(2, BigNumber.ONE, true, false, false, BigNumber.ONE, "\\text{Challenge Two}"),
    new Challenge(3, BigNumber.ONE, true, false, false, BigNumber.ONE, "\\text{Challenge Three}"),
    new Challenge(4, BigNumber.ONE, true, false, false, BigNumber.ONE, "\\text{Challenge Four}"),
    new Challenge(5, BigNumber.ONE, true, false, false, BigNumber.ONE, "\\text{Challenge Five}"),
];

var init = () => {
    currency = theory.createCurrency();

    ///////////////////
    // Main Equation Upgrades

    // q1
    {
        let getDesc = (level) => "q_1=" + getQ1(level).toString(0);
        let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
        q1 = theory.createUpgrade(0, currency, new FirstFreeCost(new ExponentialCost(10, Math.log2(1.61328))));
        q1.getDescription = (amount) => Utils.getMath(getDesc(q1.level));
        q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
    }

    // q2
    {
        let getDesc = (level) => "q_2=2^{" + level + "}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2 = theory.createUpgrade(1, currency, new ExponentialCost(15, Math.log2(8)));
        q2.getDescription = (amount) => Utils.getMath(getDesc(q2.level));
        q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
    }

    /////////////////////
    // Permanent Upgrades
    theory.createPublicationUpgrade(0, currency, 1e7);
    theory.createBuyAllUpgrade(1, currency, 1e10);
    theory.createAutoBuyerUpgrade(2, currency, 1e30);
    updateAvailability();
}

var updateAvailability = () => {
}

var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime * multiplier);
    let bonus = theory.publicationMultiplier;
    let totalScore = BigNumber.ONE
    let vq1 = getQ1(q1.level);
    let vq2 = getQ2(q2.level);
    for (const challenge of challengeList) {
        totalScore *= challenge.score;
    }

    q += totalScore * dt;
    currency.value += bonus * vq1 * vq2 * q * dt;
    theory.invalidateTertiaryEquation();
}

var startChallenge = (id) => {
    activeChallenge = id;
    challengeList[id - 1].isActive = true;
    theory.invalidatePrimaryEquation();
}

// UI

// challenge object JSON format:
// challenge = {
//   id: int,
//   score: float, 
//   isUnlocked: bool,
//   isActive: bool,
//   isCompleted: bool,
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
var goToNextStage = () => {
    var challengeMenu = createChallengeMenu();
    challengeMenu.show();
};

var canGoToNextStage = () => true;

var getInternalState = () => `${q}`

var setInternalState = (state) => {
    let values = state.split(" ");
    if (values.length > 0) q = parseBigNumber(values[0]);
}

var postPublish = () => {
    q = BigNumber.ONE;
}

var getPrimaryEquation = () => {
    let result = "";

    if (activeChallenge == 0) {
    result = "\\begin{matrix}\\dot{\\rho}=q_1";
    result += "q_2q\\\\\\dot{q}= \\prod \\lambda _i\\end{matrix}";
    theory.primaryEquationHeight = 55;
    }
    else{
       log(activeChallenge + " "+ challengeList[activeChallenge - 1].equation);
        result = challengeList[activeChallenge - 1].getEquation();
    }

    return result;
}
var getSecondaryEquation = () => theory.latexSymbol + "=\\max\\rho";
var getTertiaryEquation = () => "q=" + q.toString();
var getPublicationMultiplier = (tau) => tau.pow(0.159);
var getPublicationMultiplierFormula = (symbol) => "{" + symbol + "}^{0.159}";
var getTau = () => currency.value;
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();
var getQ1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getQ2 = (level) => BigNumber.TWO.pow(level);
init();
