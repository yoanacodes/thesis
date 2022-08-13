const express = require('express');
const cors = require('cors')
const mysql = require('mysql');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const mcache = require('memory-cache');


const PORT = process.env.PORT || 5000;
// one week (in seconds)
const cacheDuration = 604800;

const app = express();

//cache
const cache = (duration) => {
	//https://medium.com/the-node-js-collection/simple-server-side-cache-for-express-js-with-node-js-45ff296ca0f0
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      console.log('API sends cached version');
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
        console.log('API makes request');
      }
      next()
    }
  }
}


const corsOptions = {
  origin:  [
  'https://thesis.yoanacodes.com',
  'http://localhost:8080',
  ],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204  
}

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors(corsOptions));


// adding morgan to log HTTP requests
app.use(morgan('combined'));



// setup database

// server
	const db_pool = mysql.createPool({
	  host: process.env.host,
	  user: process.env.user,
	  password: process.env.password,
	  port: process.env.db_port,   
	  database: process.env.database
	});


// add root endpoint
app.get('/', cache(cacheDuration), (req, res) => {
  	
  let sql = `SELECT * FROM test`;

	db_pool.query(sql, function(err, data, fields) {
	    if (err) throw err;
	    res.json({
	      status: 200,
	      data,
	      message: "Success /"
	    })
	  });
});

// add test endpoint
app.get('/test', cache(cacheDuration), (req, res) => {
  	
  let sql = `SELECT * FROM diseases LIMIT 5`;
	

	db_pool.query(sql, function(err, data, fields) {
	    if (err) throw err;
	    res.json({
	      status: 200,
	      data,
	      message: "Success /test"
	    })
	  });
});

// add relationships endpoint
app.get('/relationships', cache(cacheDuration), (req, res) => {
  

  let nutrient_id = +req.query.nutrient_id;
  let disease_id = +req.query.disease_id;
  console.log('request query: nutrient-', nutrient_id,' disease_id-', disease_id)

  let sql = `
	  	SELECT nutrition.iso3 AS iso, 
	  				 nutrition.country, 
	  				 CAST(nutrition.median AS DECIMAL(10,1)) AS nutrient, 
	  				 CAST(diseases.value AS DECIMAL(10,1)) AS disease, 
	  				 diseases.year, 
	  				 diseases.cause_name, 
	  				 nutrition.varnum, 
	  				 diseases.measure_name, 
	  				 diseases.metric_name, 
	  				 metadata.region,  
	  				 metadata.sub_region,  
	  				 metadata.population_2020 AS pop, 
	  				 CAST(metadata.obesity AS DECIMAL(10,1)) AS obesity, 
	  				 CAST(metadata.underweight AS DECIMAL(10,1)) AS underweight, 
	  				 CAST(metadata.overweight AS DECIMAL(10,1)) AS overweight
				FROM nutrition 
			INNER JOIN diseases
				ON nutrition.iso3 = diseases.iso3
			INNER JOIN metadata
				ON metadata.iso3 = diseases.iso3	
			WHERE nutrition.year = 2018 
				AND diseases.year = 2018 
				AND diseases.measure_name = 'Prevalence' 
				AND diseases.metric_name = 'Rate' 
				AND nutrition.varnum = ${nutrient_id} 
				AND diseases.cause_id = ${disease_id}
			ORDER BY nutrition.country
			LIMIT 1000;
		`;

	db_pool.query(sql, function(err, data, fields) {
	    if (err) throw err;
	    res.json({
	      status: 200,
	      data,
	      message: "Success /relationships"
	    })
	  });
});


// starting the server
app.listen(PORT, () => {
  console.log('listening on port ', PORT);
  console.log('Hello API!')
});


