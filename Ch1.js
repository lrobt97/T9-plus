import { ExponentialCost, FirstFreeCost } from "../api/Costs";
import { Localization } from "../api/Localization";
import { parseBigNumber, BigNumber } from "../api/BigNumber";
import { theory } from "../api/Theory";
import { Utils } from "../api/Utils";

var id = "challenge_1"
var name = "Challenge 1";
var description = "Testing challenge1";
var authors = "Solarion#4131";
var version = 1.1;

var q = BigNumber.ONE;
var dotrho;
var q1, q2, c1, c2, x1, y1, x2, y2, x, y;
var q1Exp;

var init = () => {
    currency = theory.createCurrency();

    ///////////////////
    // Regular Upgrades

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
        q2 = theory.createUpgrade(1, currency, new ExponentialCost(15, Math.log2(64)));
        q2.getDescription = (amount) => Utils.getMath(getDesc(q2.level));
        q2.getInfo = (amount) => Utils.getMathTo(getInfo(q2.level), getInfo(q2.level + amount));
    }

    // x1
    {
        let getDesc = (level) => "x_1=" + getY2(1000*level).toString();
        let getInfo = (level) => "x_1=" + getY2(level).toString();
        x1 = theory.createUpgrade(2, currency, new ExponentialCost(10, Math.log2(1e6)));
        x1.getDescription = (amount) => Utils.getMath(getDesc(x1.level));
        x1.getInfo = (amount) => Utils.getMathTo(getInfo(x1.level), getInfo(x1.level + amount));
    }
    // x2
    {
        let getDesc = (level) => "x_2=" + getY2(level).toString();
        let getInfo = (level) => "x_2=" + getY2(level).toString();
        x2 = theory.createUpgrade(3, currency, new ExponentialCost(10, Math.log2(1e6)/1000));
        x2.getDescription = (amount) => Utils.getMath(getDesc(x2.level));
        x2.getInfo = (amount) => Utils.getMathTo(getInfo(x2.level), getInfo(x2.level + amount));
    }

    // y1
    {
        let getDesc = (level) => "y_1=" + getY2(1000*level).toString();
        let getInfo = (level) => "y_1=" + getY2(level).toString();
        y1 = theory.createUpgrade(4, currency, new ExponentialCost(10, Math.log2(1e6)));
        y1.getDescription = (amount) => Utils.getMath(getDesc(y1.level));
        y1.getInfo = (amount) => Utils.getMathTo(getInfo(y1.level), getInfo(y1.level + amount));
    }
    // y2
    {
        let getDesc = (level) => "y_2=" + getY2(level).toString();
        let getInfo = (level) => "y_2=" + getY2(level).toString();
        y2 = theory.createUpgrade(5, currency, new ExponentialCost(10, Math.log2(1e6)/1000));
        y2.getDescription = (amount) => Utils.getMath(getDesc(y2.level));
        y2.getInfo = (amount) => Utils.getMathTo(getInfo(y2.level), getInfo(y2.level + amount));
    }
    // D
    {
        let getDesc = (level) => "D=" + getD(level).toString();
        let getInfo = (level) => "D=" + getD(level).toString();
        D = theory.createUpgrade(6, currency, (new ExponentialCost(10, Math.log2(1e4))));
        D.getDescription = (amount) => Utils.getMath(getDesc(D.level));
        D.getInfo = (amount) => Utils.getMathTo(getInfo(D.level), getInfo(D.level + amount));
        //D.canBeRefunded = (_) => true;
    }
    
    /////////////////////
    // Permanent Upgrades
    //theory.createPublicationUpgrade(0, currency, 1e7);
    theory.createBuyAllUpgrade(1, currency, 1e10);
    theory.createAutoBuyerUpgrade(2, currency, 1e30);

    /////////////////////
    // Checkpoint Upgrades
   

    updateAvailability();
}

var updateAvailability = () => {
    //c3.isAvailable = c3Term.level > 0;
    //c3Exp.isAvailable = c3Term.level > 0;
}

var tick = (elapsedTime, multiplier) => {
    let dt = BigNumber.from(elapsedTime * multiplier);
    let bonus = theory.publicationMultiplier;
  
    x = getX1(x1.level)+getX2(x2.level);
    y = getY1(y1.level)+getY2(y2.level);
    vd = getD(D.level);
  
    let bigx = BigNumber.from(x);
    let bigy = BigNumber.from(y);
    var xyval = bigx.pow(2) - getD(D.level) * bigy.pow(2);
  
    q += vd * (x+y) * (1/xyval.abs());
    vq1 = getQ1(q1.level);
    vq2 = getQ2(q2.level);
  
    dotrho = vq1 * vq2 * q;
    currnecy.value += dotrho * dt * bonus;
    
    theory.invalidateTertiaryEquation();
}

var getInternalState = () => `${q}`

var setInternalState = (state) => {
    let values = state.split(" ");
    if (values.length > 0) q = parseBigNumber(values[0]);
}

var postPublish = () => {
    q = BigNumber.ONE;
}

var getPrimaryEquation = () => {
    let result = "\\begin{matrix}\\dot{\\rho}=q_1";
    
    result += "q_2q\\\\\\dot{q}=D (x+y)";
    
    result += "\\times\\left|x^2-Dy^2\\right|^{-1}\\end{matrix}";

    theory.primaryEquationHeight = 85;

    return result;
}

var getSecondaryEquation = () => {
    res = "";
    res += "x = x_1+x_2\\\\"
    res += "y = y_1+y_2\\\\"
    //res += "x = x_1+x_2\\\\"
    //res += "x = x_1+x_2\\\\"
    res += theory.latexSymbol + "=\\max\\rho";
    theory.secondaryEquationHeight = 100;
    return res;

}
var getTertiaryEquation = () => {
    //let m = getN(n.level) + (c2.isAvailable ? c2.level : 0);
    
    let result = "q=" + q.toString() + ",\\;x=" + x.toString(0) + ",\\;y=" + y.toString(0) + ",\\;";
    result += "\\left|x^2-D*y^2\\right|^{-1}"
    result += " = ";
    let bigx = BigNumber.from(x);
    let bigy = BigNumber.from(y);
    var xyval = bigx.pow(2) - getD(D.level) * bigy.pow(2);
    result += (xyval).abs();
    result += ",\\;\\dot{\\rho}=";
    result += dotrho.toString(0);
    theory.tertiaryEquationHeight = 40;
    return result;
}
var alwaysShowRefundButtons = () => true;
var getPublicationMultiplier = (tau) => tau.pow(0.159);
var getPublicationMultiplierFormula = (symbol) => "{" + symbol + "}^{0.159}";
var getTau = () => currency.value;
var get2DGraphValue = () => currency.value.sign * (BigNumber.ONE + currency.value.abs()).log10().toNumber();

var getQ1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 0);
var getQ2 = (level) => BigNumber.TWO.pow(level);
var getC1 = (level) => Utils.getStepwisePowerSum(level, 2, 10, 1);
var getC2 = (level) => BigNumber.TWO.pow(level);
var getC3 = (level) => BigNumber.TWO.pow(level);
var getX1 = (level) => BigNumber.THOUSAND * level;
var getX2 = (level) => level+1;
var getY1 = (level) => BigNumber.THOUSAND * level;
var getY2 = (level) => level+1;
var getD = (level) => BigNumber.from(level+2);

init();
