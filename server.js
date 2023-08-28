const express = require("express");
const app = express();

const path = require('path');
const bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

const cors = require('cors');
app.use(cors());



app.use(express.static('public'));

const axios = require("axios");


const mysql = require('mysql2');
const config = require('./config');

const connectionConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
};

const schemaName = 'tsho';
const connection = mysql.createConnection(connectionConfig);
console.log('Connesso al server MySQL');


async function db() {

  try {
    const connection1 = connection.promise();


    const [rows] = await connection1.query(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, [schemaName]);

    // Se lo schema non esiste, crealo
    if (rows.length === 0) {
      await connection1.query(`CREATE DATABASE ${schemaName}`);
      console.log('Schema creato con successo!');
    } else {
      console.log('Lo schema esiste già.');
    }

    // Use the created schema
    await connection1.query(`USE ${schemaName}`);

    // Create tables if they don't exist
    await connection1.query(`
      CREATE TABLE IF NOT EXISTS utenti (
        username varchar(45) NOT NULL,
        password varchar(45) NOT NULL,
        PRIMARY KEY (username),
        UNIQUE KEY username_UNIQUE (username)
      )
    `);

    await connection1.query(`
      CREATE TABLE IF NOT EXISTS commenti (
        id_commento int NOT NULL AUTO_INCREMENT,
        username varchar(45) NOT NULL,
        id_film varchar(20) NOT NULL,
        commento varchar(400) DEFAULT NULL,
        data_commento date DEFAULT NULL,
        PRIMARY KEY (id_commento),
        UNIQUE KEY id_commento_UNIQUE (id_commento),
        KEY username_idx (username),
        KEY id_film_idx (id_film),
        CONSTRAINT username FOREIGN KEY (username) REFERENCES utenti (username)
      )
    `);

    await connection1.query(`
      CREATE TABLE IF NOT EXISTS media (
        imdbID varchar(20) NOT NULL,
        Title varchar(200) NOT NULL,
        Year varchar(20) DEFAULT NULL,
        Type varchar(45) DEFAULT NULL,
        Plot varchar(2000) DEFAULT NULL,
        Runtime varchar(10) DEFAULT NULL,
        Genre varchar(150) DEFAULT NULL,
        Poster varchar(300) DEFAULT NULL,
        Released varchar(15) DEFAULT NULL,
        PRIMARY KEY (imdbID),
        UNIQUE KEY id_UNIQUE (imdbID)
      )
    `);
    const controllo = await connection1.query('SELECT * FROM media');
    if (controllo[0].length === 0) {
      await connection1.query(`
        INSERT INTO media (imdbID, Title, Year, Type,Plot,Runtime,Genre,Poster,Released)
        VALUES (?, ?,?,?,?,?,?,?,?)
        `, ['tt14681924', 'My Adventures with Superman', '2023–', 'series', 'Clark Kent builds his secret Superman identity and embraces his role as the hero of Metropolis, while sharing adventures and falling in love with Lois, a star investigative journalist, who also takes Jimmy Olsen under her wing.', 'N/A', 'Animation, Action, Adventure', 'https://m.media-amazon.com/images/M/MV5BYTJjMDBjNjgtYjc2Ni00NDZiLWE2YjQtODQ1YTBlYTFkOWE4XkEyXkFqcGdeQXVyNjk1Mzk1NzI@._V1_SX300.jpg', '06 Jul 2023']);


      await connection1.query(`
        INSERT INTO media (imdbID, Title, Year, Type,Plot,Runtime,Genre,Poster,Released)
        VALUES (?, ?,?,?,?,?,?,?,?)
        `, ['tt0439572', 'The Flash', '2023', 'movie', 'The plot is unknown. Feature film based on the comic book superhero, The Flash.', '144 min', 'Action, Adventure, Fantasy', 'https://m.media-amazon.com/images/M/MV5BZWE2ZWE5MDQtMTJlZi00MTVjLTkxOTgtNmNiYjg2NDIxN2NhXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_SX300.jpg', '16 Jun 2023']);
    }

    await connection1.query(`
      CREATE TABLE IF NOT EXISTS seguiti (
        username varchar(45) NOT NULL,
        username_seguiti varchar(45) NOT NULL,
        PRIMARY KEY (username,username_seguiti),
        CONSTRAINT usernameù FOREIGN KEY (username) REFERENCES utenti (username)
      )
    `);

    await connection1.query(`
      CREATE TABLE IF NOT EXISTS visti (
        username varchar(45) NOT NULL,
        id_film varchar(45) NOT NULL,
        tipo varchar(45) DEFAULT NULL,
        data_visione varchar(45) NOT NULL,
        KEY username_idx (username),
        KEY id_film_idx (id_film),
        CONSTRAINT id_film FOREIGN KEY (id_film) REFERENCES media (imdbID),
        CONSTRAINT usernamey FOREIGN KEY (username) REFERENCES utenti (username)
      )
    `);


  } catch (error) {
    console.error('Errore:', error);
  }

}


db();


app.use(bodyParser.json());



app.post("/register", (req, res) => {

  inputData = {
    email: req.body.email,
    password: req.body.password,
    confirm_password: req.body.confirm_password
  }
  if (inputData.confirm_password != inputData.password) {
    res.message = "Le password non corrispondono";
    res.sendStatus(400);
    return;
  }
  var sql = 'SELECT * FROM utenti WHERE username =?';
  try {
    connection.query(sql, [inputData.email], function (err, data, fields) {
      if (err && err != null) {
        res.message = "Error: " + err.message;
        res.sendStatus(500);
        return;
      }
      else if (data.length > 0) {
        res.message = inputData.email + "già registrato";
        res.sendStatus(409);
        return;
      } else {
        var sql = "INSERT INTO utenti SET ?";
        connection.query(sql, { username: inputData.email, password: inputData.password }, async (err, data) => {
          if (err && err != null) {
            res.message = "Error: " + err.message;
            res.sendStatus(500);
            return;
          }
          res.message = "Registrato con successo";
          res.sendStatus(200);
        });
      }
    })
  } catch (error) {
    console.log(error);
  }

});




app.post("/login", async (req, res) => {

  const connection1 = connection.promise();

  const { email, password } = req.body;

  var sql = 'SELECT * FROM utenti WHERE username =?';
  const data = await connection1.query(sql, [email], (err) => {
    if (err && err != null) {
      res.message = "Error: " + err.message;
      res.sendStatus(500);
      return;
    }
  });

  if (data[0].length === 0) {
    res.status(404).json({ message: 'Utente non registrato' });
  }
  else if (data[0][0].password !== password) {
    res.status(403).json({ message: 'Password errata' });

  }

  else {
    res.status(200).json({ message: 'Accesso effettuato' });
  }
})




app.get('/api/populars/film', (req, res) => {
  try {
    connection.query(
      'SELECT * FROM media WHERE Year = 2023 AND Type = "movie" AND Poster <> "N/A"',
      (err, results) => {
        if (err) {
          console.error('Errore nella verifica dei dati nel database:', err);
          res.status(500).json({ error: 'Errore nella verifica dei dati nel database' });
        } else {
          res.json({ message: 'Query eseguita con successo!', data: results });
        }
      }
    );
  } catch (error) {
    console.error('Errore nella richiesta al server:', error);
    res.status(500).json({ error: 'Errore nella richiesta al server' });
  }
});

app.get('/api/populars/series', (req, res) => {
  try {
    connection.query(
      'SELECT * FROM media WHERE Year = 2023 AND Type = "series" AND Poster <> "N/A"',
      (err, results) => {
        if (err) {
          console.error('Errore nella verifica dei dati nel database:', err);
          res.status(500).json({ error: 'Errore nella verifica dei dati nel database' });
        } else {
          res.json({ message: 'Query eseguita con successo!', data: results });
        }
      }
    );
  } catch (error) {
    console.error('Errore nella richiesta al server:', error);
    res.status(500).json({ error: 'Errore nella richiesta al server' });
  }
});

app.post('/api/real-time-search', async (req, res) => {
  try {
    const { title } = req.body;
    const sql = 'SELECT * FROM media WHERE title LIKE ?';
    connection.query(sql, [`%${title}%`], (err, data) => {
      if (err) {
        console.error('Errore nella verifica dei dati nel database:', err);
        res.status(500).json({ error: 'Errore nella verifica dei dati nel database' });
      } else {
        res.json({ message: 'Richiesta al db eseguita', data });
      }
    });
  } catch (error) {
    console.error('Errore nella richiesta al db:', error);
    res.status(500).json({ error: 'Errore nella richiesta al db' });
  }
});


app.post('/api/request-local', async (req, res) => {
  try {
    const { title, url } = req.body;
    connection.query(
      'SELECT * FROM media WHERE title LIKE ?',
      [`%${title}%`],
      (err, results) => {
        if (err) {
          console.error('Errore nella verifica dei dati nel database:', err);
          res.status(500).json({ error: 'Errore nella verifica dei dati nel database' });
        } else {
          if (results.length > 0) {
            res.json({ message: 'Richiesta al db eseguita', data: results });
          } else {
            res.json({ message: 'Titolo non trovato nel database', data: null });
          }
        }
      }
    );
  } catch (error) {
    console.error('Errore nella richiesta al db:', error);
    res.status(500).json({ error: 'Errore nella richiesta al db' });
  }
});


async function richiestaEsterna(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
}


function controllaID(imdbID) {
  return new Promise((resolve, reject) => {
    connection.query(
      'SELECT * FROM media WHERE imdbID = ?',
      [imdbID],
      (err, results) => {
        if (err) {
          console.error('Errore nella verifica dei dati nel database:', err);
          reject(err);
        } else if (results.length > 0) {
          resolve(true); // L'imdbID esiste già nel database
        } else {
          resolve(false); // L'imdbID non esiste nel database
        }
      }
    );
  });
}


app.post('/api/request-to-server', async (req, res) => {
  try {
    const { title, url } = req.body;
    const rispostaEsterna = await richiestaEsterna(url + "type=movie&");
    const rispostaEsterna2 = await richiestaEsterna(url + "type=movie&page=2&");
    const rispostaEsterna3 = await richiestaEsterna(url + "type=series&");
    const rispostaEsterna4 = await richiestaEsterna(url + "type=series&page=2&");

    const concatenatedArray = [
      ...(rispostaEsterna?.Search ?? []),
      ...(rispostaEsterna2?.Search ?? []),
      ...(rispostaEsterna3?.Search ?? []),
      ...(rispostaEsterna4?.Search ?? [])
    ];
    //METODO CHE USAVO PRIMA
    // const concatenatedArray = risposteEsternaArray.reduce((result, risposta) => {
    //   const searchArray = risposta?.Search ?? []; // Utilizza un array vuoto come fallback se risposta.Search è undefined
    //   return result.concat(searchArray);
    // }, []);

    if (concatenatedArray.length <= 0) {
      res.json({ message: 'Titolo non trovato online', data: null });
      return
    }

    for (const movie of concatenatedArray) {
      const imdbIDExists = await controllaID(movie.imdbID);
      if (imdbIDExists) {
        continue; // Salta l'iterazione e continua con il prossimo film
      }

      var sql = "INSERT INTO media SET ?";
      connection.query(sql, { imdbID: movie.imdbID, Title: movie.Title, Year: movie.Year, Type: movie.Type, Plot: movie.Plot, Poster: movie.Poster }, (err, results) => {
        if (err) {
          console.error('Errore nell\'inserimento dei dati nel database:', err);
          res.status(500).json({ error: 'Errore nell\'inserimento dei dati nel database' });
          return;
        } else {
        }
      })
    }

    //ORA CHE LI HO SALVATI POSSO FARE LA RICERCA LOCALE! FINALLY
    res.json({ message: 'Richiesta al server eseguita con successo!', data: concatenatedArray });
  } catch (error) {
    console.error('Errore nella richiesta al server:', error);
    res.status(500).json({ error: 'Errore nella richiesta al server' });
  }

});


app.post('/api/request-to-server-better', async (req, res) => {
  try {
    const { title, url } = req.body;
    const rispostaEsterna = await richiestaEsterna(url + "type=movie&page=1&");
    const rispostaEsterna2 = await richiestaEsterna(url + "type=movie&page=2&");
    const rispostaEsterna3 = await richiestaEsterna(url + "type=movie&page=3&");
    const rispostaEsterna4 = await richiestaEsterna(url + "type=movie&page=4&");
    const rispostaEsterna5 = await richiestaEsterna(url + "type=movie&page=5&");


    const rispostaEsterna6 = await richiestaEsterna(url + "type=series&page=1&");
    const rispostaEsterna7 = await richiestaEsterna(url + "type=series&page=2&");
    const rispostaEsterna8 = await richiestaEsterna(url + "type=series&page=3&");
    const rispostaEsterna9 = await richiestaEsterna(url + "type=series&page=4&");
    const rispostaEsterna10 = await richiestaEsterna(url + "type=series&page=5&");


    const concatenatedArray = [
      ...(rispostaEsterna?.Search ?? []),
      ...(rispostaEsterna2?.Search ?? []),
      ...(rispostaEsterna3?.Search ?? []),
      ...(rispostaEsterna4?.Search ?? []),
      ...(rispostaEsterna5?.Search ?? []),
      ...(rispostaEsterna6?.Search ?? []),
      ...(rispostaEsterna7?.Search ?? []),
      ...(rispostaEsterna8?.Search ?? []),
      ...(rispostaEsterna9?.Search ?? []),
      ...(rispostaEsterna10?.Search ?? [])

    ];
    //METODO CHE USAVO PRIMA
    // const concatenatedArray = risposteEsternaArray.reduce((result, risposta) => {
    //   const searchArray = risposta?.Search ?? []; // Utilizza un array vuoto come fallback se risposta.Search è undefined
    //   return result.concat(searchArray);
    // }, []);

    if (concatenatedArray.length <= 0) {
      res.json({ message: 'Titolo non trovato online', data: null });
      return
    }

    for (const movie of concatenatedArray) {
      const imdbIDExists = await controllaID(movie.imdbID);
      if (imdbIDExists) {
        continue; // Salta l'iterazione e continua con il prossimo film
      }

      var sql = "INSERT INTO media SET ?";
      connection.query(sql, { imdbID: movie.imdbID, Title: movie.Title, Year: movie.Year, Type: movie.Type, Plot: movie.Plot, Poster: movie.Poster }, (err, results) => {
        if (err) {
          console.error('Errore nell\'inserimento dei dati nel database:', err);
          res.status(500).json({ error: 'Errore nell\'inserimento dei dati nel database' });
          return;
        } else {
        }
      })
    }

    //ORA CHE LI HO SALVATI POSSO FARE LA RICERCA LOCALE! FINALLY
    res.json({ message: 'Richiesta al server eseguita con successo!', data: concatenatedArray });
  } catch (error) {
    console.error('Errore nella richiesta al server:', error);
    res.status(500).json({ error: 'Errore nella richiesta al server' });
  }

});


app.post('/api/request-plot', async (req, res) => {
  const connection1 = connection.promise()
  const { id, url, username } = req.body;
  let query = "SELECT * FROM media WHERE imdbID = ?";

  await connection1.query(query, [id]).then(async (results) => {
    if (results[0][0].Plot !== null) {
      let query = "SELECT * FROM visti WHERE username = ? AND id_film = ?";
      await connection1.query(query, [username, id]).then(async (results2) => {
        if (results2[0].length > 0) {
          const body = {
            Genre: results[0][0].Genre,
            Runtime: results[0][0].Runtime,
            Plot: results[0][0].Plot,
            Released: results[0][0].Released,
            Seen: true
          }
          res.json(body);
        }
        else {
          const body = {
            Genre: results[0][0].Genre,
            Runtime: results[0][0].Runtime,
            Plot: results[0][0].Plot,
            Released: results[0][0].Released,
            Seen: false
          }

          res.json(body);
        }
      })
    }
    else {
      const response = await axios.get(url + "i=" + id + "&plot=full&");
      var sql = "UPDATE media SET Runtime = ?, Genre = ?, Plot = ?, Released = ? WHERE imdbID = ?";
      const data = [response.data.Runtime, response.data.Genre, response.data.Plot, response.data.Released, id];
      await connection1.query(sql, data).then((results3) => {
        const body = {
          Runtime: data[0],
          Genre: data[1],
          Plot: data[2],
          Released: data[3],
          Seen: false
        }
        res.json(body);

      }).catch((err) => {
        console.error('Errore nel caso in cui ho il plot', err);
        res.status(500).json({ error: 'Errore nel caso in cui ho il plot' });
      })
    }

  }).catch((err) => {
    console.error('Errore nel caso in cui ho il plot', err);
    res.status(500).json({ error: 'Errore nel caso in cui ho il plot' });
  })
})


async function controllaSeGiàVisto(utente, id) {
  const connection1 = connection.promise();
  try {
    const results = await connection1.query("SELECT * FROM visti WHERE username = ? AND id_film = ?", [utente, id]);
    return results[0].length;
  } catch (err) {
    console.error('Errore nella verifica dei dati nel database:', err);
    throw err;
  }
}


app.post('/api/mark-as-watched', async (req, res) => {
  const { id, utente, date } = req.body;

  try {
    // Controlla se il film è già stato segnato come visto dall'utente
    const giàVisto = await controllaSeGiàVisto(utente, id);
    if (giàVisto === 1) {
      res.send("Già visto");
      return;
    }
    const connection1 = connection.promise();

    // Inserisce la nuova voce nella tabella 'visti'
    const insertResult = await connection1.query("INSERT INTO visti SET ?", {
      username: utente,
      id_film: id,
      data_visione: date
    });

    res.send("Film segnato come già visto!");
  } catch (err) {
    console.error('Errore nell\'inserimento dei dati nel database:', err);
    res.status(500).json({ error: 'Errore nell\'inserimento dei dati nel database' });
  }
});





app.post('/api/get-watched', async (req, res) => {
  const connection1 = connection.promise();

  const username = req.body.username;
  let tot_film = 0;
  let tot_serie = 0;
  let tempo_film = 0;
  const queryVisti = `SELECT id_film FROM visti WHERE username = ?`;

  try {
    const resultsVisti = await connection1.execute(queryVisti, [username]);
    //ho preso tutti i film visti nel formato {id_film: 'id'}
    const filmVistiIds = resultsVisti[0].map((row) => row.id_film);

    //adessp ho tutti i film visti qui {'id','id','id'};

    const queryMedia = `SELECT imdbID, Runtime, Type FROM media WHERE imdbID IN (?)`;

    const resultsMedia = await connection1.query(queryMedia, [filmVistiIds]);

    //Ora dentro result media ho gli id dei film e il runtime di ogni film

    const updatedMediaArray = resultsMedia[0].map((media) => ({
      ...media, // Mantiene gli altri campi inalterati
      Runtime: media.Runtime.replace(' min', ''), // Rimuove la parola "min" dal campo "Runtime"
    }));


    updatedMediaArray.forEach(media => {
      if (media.Type === "series") {
        tot_serie++;
      }
      if (media.Type === "movie") {
        tot_film++;
        if (media.Runtime !== 'N/A') {
          tempo_film = tempo_film + parseInt(media.Runtime);
        }
      }
    });
    res.json({
      tot_film: tot_film,
      tot_serie: tot_serie,
      tempo_film: tempo_film,
    });

  } catch (err) {
    console.error('Errore nella ricerca dei film visti: ', err);
    res.status(500).json({ error: 'Errore nella ricerca dei film visti' });

  }


});


app.post('/api/get-comments-number', async (req, res) => {

  const username = req.body.username;

  const query = `SELECT username FROM commenti WHERE username = ?`;
  connection.query(query, [username], (err, data) => {
    if (err) throw err;
    res.json(data.length);
  })

})



app.post('/api/seen-films', async (req, res) => {

  const username = req.body.username;
  let query = `SELECT id_film FROM visti WHERE username = ?`;
  connection.query(query, [username], async (err, data) => {
    if (err) throw err;

    const filmVistiIds = data.map((row) => row.id_film);

    if (filmVistiIds.length === 0) {

      res.json({ message: "nessun risultato" })
      return;
    }
    let secondQuery = "SELECT * FROM media";
    if (filmVistiIds.length > 0) {
      secondQuery += " WHERE imdbID IN (?)";
    }

    connection.query(secondQuery, [filmVistiIds], async (err, resultsMedia) => {
      if (err) throw err;

      res.json({ resultsMedia });
    })
  })
})

app.post('/api/submit-comment', async (req, res) => {
  const { username, id, comment, data } = req.body;
  let query = "INSERT INTO commenti SET ?";
  connection.query(query, { username: username, id_film: id, commento: comment, data_commento: data }, async (err, results) => {
    if (err) {
      console.error('Errore nell\'inserimento del commento nel database:', err);
      res.status(500).json({ error: 'Errore nell\'inserimento del commento nel database' });
      return;
    } else {
      res.json({ message: "inserito" });
    }

  })
})


app.post('/api/retrieve-comments', async (req, res) => {
  const { id } = req.body;

  let query = "SELECT * FROM commenti WHERE id_film=?";

  connection.query(query, [id], async (err, data) => {
    if (err) throw err;
    if (data.length > 0) {
      res.json({ data });
    }
    else {
      res.json({ message: "nessun commento" });

    }

  })
})

app.post('/api/follow-request', async (req, res) => {
  const { usernameAttuale, username } = req.body;
  const connection1 = connection.promise();
  const sql = 'INSERT INTO seguiti (username, username_seguiti) VALUES (?, ?)';

  await connection1.query(sql, [usernameAttuale, username])
    .then(async (results) => {
      res.status(200).json({ message: 'Follow effettuato con successo' });
    }).catch((err) => {
      console.error('Errore durante il follow', err);
      res.status(500).json({ error: 'Errore durante il follow' });
    })
})


app.post('/api/unfollow-request', async (req, res) => {
  const { usernameAttuale, username } = req.body;
  const connection1 = connection.promise();
  const sql = 'DELETE FROM seguiti WHERE username = ? AND username_seguiti = ?';

  await connection1.query(sql, [usernameAttuale, username])
    .then(async (results) => {
      res.status(200).json({ message: 'unfollow effettuato con successo' });
    }).catch((err) => {
      console.error('Errore durante unfollow', err);
      res.status(500).json({ error: 'Errore durante unfollow' });
    })
})

app.post('/api/already-following', async (req, res) => {
  const { usernameAttuale, username } = req.body;
  const connection1 = connection.promise();
  const sql = 'SELECT * FROM seguiti seguiti WHERE username = ? AND username_seguiti = ?';
  await connection1.query(sql, [usernameAttuale, username])
    .then(async (results) => {
      if (results[0].length > 0) {
        res.json({ alreadyFollowing: true });
      } else {
        res.json({ alreadyFollowing: false });
      }
    }).catch((err) => {
      console.error('Errore durante unfollow', err);
      res.status(500).json({ error: 'Errore durante unfollow' });
    })

})


app.post("/api/get-followers", async (req, res) => {
  const { username } = req.body;

  const connection1 = connection.promise();
  const sql = 'SELECT * FROM seguiti seguiti WHERE username = ?';
  await connection1.query(sql, [username])
    .then((results) => {
      res.json({ length: results[0].length });
    }).catch((err) => {
      console.error('Errore durante il recupero dei followers', err);
      res.status(500).json({ error: 'Errore durante il recupero dei followers' });
    })
})

app.post("/api/show-followers", async (req, res) => {
  const { username } = req.body;
  const connection1 = connection.promise();
  const sql = 'SELECT * FROM seguiti WHERE username = ?';
  await connection1.query(sql, [username])
    .then((results) => {
      res.json({ results: results });
    }).catch((err) => {
      console.error('Errore durante il recupero dei followers', err);
      res.status(500).json({ error: 'Errore durante il recupero dei followers' });
    })
})


app.post("/api/show-followings", async (req, res) => {
  const { username } = req.body;
  const connection1 = connection.promise();
  const sql = 'SELECT * FROM seguiti WHERE username_seguiti = ?';
  await connection1.query(sql, [username])
    .then((results) => {
      res.json({ results: results });
    }).catch((err) => {
      console.error('Errore durante il recupero dei followers', err);
      res.status(500).json({ error: 'Errore durante il recupero dei followers' });
    })
})


app.post("/api/get-following", async (req, res) => {
  const { username } = req.body;

  const connection1 = connection.promise();
  const sql = 'SELECT * FROM seguiti WHERE username_seguiti = ?';
  await connection1.query(sql, [username])
    .then((results) => {
      res.json({ length: results[0].length });
    }).catch((err) => {
      console.error('Errore durante il recupero dei seguiti', err);
      res.status(500).json({ error: 'Errore durante il recupero dei seguiti' });
    })
})

app.listen(3000, () => {
  console.log("In ascolto sulla porta 3000");
})
