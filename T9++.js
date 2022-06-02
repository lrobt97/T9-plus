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
var challengeCompletionUpgrade;
var challengeBar, challengeBarTau, challengeBarCurrency, challengeCompletionButton;
class Challenge {
    constructor(id, score, isUnlocked, completionRequirement, primaryEquation, secondaryEquation, tertiaryEquation, calculateScore) {
        this.id = id;
        this.score = score;
        this.isUnlocked = isUnlocked;
        this.completionRequirement = completionRequirement;
        this.challengeCurrency = BigNumber.ONE;
        this.q = BigNumber.ONE;
        this.primaryEquation = primaryEquation;
        this.secondaryEquation = secondaryEquation;
        this.tertiaryEquation = tertiaryEquation;
        this.calculateScore = calculateScore;
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

    getCompletionRequirement() {
        return this.completionRequirement;
    }

    completeChallenge(){
        this.score = this.calculateScore();
        this.challengeCurrency = BigNumber.ONE;
        activeChallenge = 0;
        theory.invalidatePrimaryEquation();
    }
}

var challengeList = [
    new Challenge(1, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge One}", "", "", () => {return BigNumber.from(1e10)}),
    new Challenge(2, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge Two}", "", "", () => {return BigNumber.from(1e10)}),
    new Challenge(3, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge Three}", "", "",  () => {return BigNumber.from(1e10)}),
    new Challenge(4, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge Four}", "", "",  () => {return BigNumber.from(1e10)}),
    new Challenge(5, BigNumber.ONE, true, BigNumber.ONE, "\\text{Challenge Five}", "", "",  () => {return BigNumber.from(1e10)}),
];

var init = () => {
    currency = theory.createCurrency();

    ///////////////////
    // Main Equation Upgrades

    // q1
    {
        let getDesc = (level) => "q_1=" + getQ1(level).toString(0);
        let getInfo = (level) => "q_1=" + getQ1(level).toString(0);
        q1 = theory.createUpgrade(1, currency, new FirstFreeCost(new ExponentialCost(10, Math.log2(1.61328))));
        q1.getDescription = (amount) => Utils.getMath(getDesc(q1.level));
        q1.getInfo = (amount) => Utils.getMathTo(getInfo(q1.level), getInfo(q1.level + amount));
    }

    // q2
    {
        let getDesc = (level) => "q_2=2^{" + level + "}";
        let getInfo = (level) => "q_2=" + getQ2(level).toString(0);
        q2 = theory.createUpgrade(2, currency, new ExponentialCost(15, Math.log2(8)));
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
    for (let challenge of challengeList) {
        totalScore *= challenge.getScore();
    }

    q += totalScore * dt;
    currency.value += bonus * vq1 * vq2 * q * dt;
    challengeBarTau.text = Utils.getMath(theory.tau + theory.latexSymbol);
    challengeBarCurrency.text = Utils.getMath(currency.value.toString() + "\\rho");
    challengeCompletionButton.isVisible = (activeChallenge > 0 && challengeList[activeChallenge - 1].getCurrency() >= (challengeList[activeChallenge - 1].getCompletionRequirement()));
    theory.invalidateTertiaryEquation();
}

var startChallenge = (id) => {
    activeChallenge = id;
    theory.invalidatePrimaryEquation();
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

var  getCurrencyBarDelegate = () => {
    challengeBar = ui.createGrid({
        columnDefinitions: ["20*", "30*", "auto"],
        children: [
            challengeBarTau = ui.createLatexLabel({
                text: Utils.getMath(getTau() + theory.latexSymbol),
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
    theory.primaryEquationHeight = 55;
    if (activeChallenge == 0) {
    result = "\\begin{matrix}\\dot{\\rho}=q_1";
    result += "q_2q\\\\\\dot{q}= \\prod \\lambda _i\\end{matrix}";
    }
    else{
        result = challengeList[activeChallenge - 1].getPrimaryEquation();
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
