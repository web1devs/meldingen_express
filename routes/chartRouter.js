const express = require('express');
const router = express.Router();
const { meldingenStats, ambulanceStats, brandweerMeldingen, politieMeldingen, provincie, provincieChart,emergencyMeldingen } = require('../Controller/ChartController')

router.route('/meldingen/:hour/:region')
        .get(meldingenStats);

router.route('/ambulance/:hour/:region')
        .get(ambulanceStats);

router.route('/brandweer/:hour/:region')
        .get(brandweerMeldingen);

router.route('/politie/:hour/:region')
        .get(politieMeldingen);

router.route('/provincie')
        .get(provincie)

router.route('/prov/:hour/:provincie')
        .get(provincieChart)

router.route('/emergency/:hour/:dienst')
        .get(emergencyMeldingen)


module.exports = router