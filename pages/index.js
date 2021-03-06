import Head from "next/head";
import Image from "next/image";
// import styles from "../styles/Home.module.css";
import React from "react";
import { ethers } from "ethers";
import abi from "../utils/EtherFavoriteSongs.json";

const axios = require("axios");

class Home extends React.Component {
  constructor(props) {
    super(props);
    this.contractAddress = "0x9F119C04BF39033D699f8Ab6bd8B93293eAA9dD4";
    this.contractABI = abi.abi;

    // const [currentAccount, setCurrentAccount] = useState("");
    this.state = {
      url: "",
      account: null,
      total: 0,
      mining: false,
      allSongs: [],
      userFound: false,
    };
    this.handleChange = this.handleChange.bind(this);

    this.checkIfWalletIsConnected();
  }

  handleChange(event) {
    this.setState({ url: event.target.value });
  }

  setCurrentAccount = (account) => {
    this.setState({ account: account });
  };

  getAllSongs = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const options = {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        };
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteSongsPortalContract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          signer
        );

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const songs = await favoriteSongsPortalContract.getAllSongs();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let songsCleaned = [];
        songs.forEach((song) => {
          // console.log(data);
          axios
            .get("/api/spotify/" + encodeURIComponent(song.url))
            .then((data) => {
              // console.log(data);
              const preview = data.data;
              songsCleaned.push({
                id: song.timestamp,
                contributor: song.contributor,
                timestamp: new Date(song.timestamp * 1000).toLocaleDateString(
                  "en-US",
                  options
                ),
                url: song.url,
                name: preview.title,
                preview: preview.audio,
                audio: preview.audio,
                embed: preview.embed,
                image: preview.image,
                artist: preview.artist,
              });

              this.setState({
                allSongs: songsCleaned.sort(function (a, b) {
                  return b.id - a.id;
                }),
              });
            });
        });
        // console.log(songsCleaned);

        /*
         * Store our data in React State
         */
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  onNewSong = (from, timestamp, url) => {
    console.log("new song listener", from, timestamp, url);
    this.setState({
      allSongs: [
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          url: url,
        },
        ...this.state.allSongs,
      ],
    });
  };

  setupListener = () => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      let favoriteSongsPortalContract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        signer
      );
      favoriteSongsPortalContract.on("NewSong", this.onNewSong);
    }
  };

  checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        this.setCurrentAccount(account);
        this.setState({
          userFound: true,
        });
        this.getTotal();
        this.getAllSongs();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      this.setCurrentAccount(accounts[0]);
      this.getAllSongs();
      this.getTotal();
      this.setState({
        userFound: true,
      });
    } catch (error) {
      console.log(error);
    }
  };

  getTotal = async () => {
    console.log("get total");
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const favoriteSongsPortalContract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        signer
      );

      let count = await favoriteSongsPortalContract.getTotalSongs();
      this.setState({ total: count.toNumber() });
      console.log(this.state.total);
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  };

  wave = async () => {
    if (this.state.url === "") {
      alert("Please provide a spotify link");
      return false;
    }
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const favoriteSongsPortalContract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          signer
        );

        // let count = await favoriteSongsPortalContract.getTotalSongs();
        // console.log("Retrieved total wave count...", count.toNumber());

        /*
         * Execute the actual wave from your smart contract
         */
        this.setState({ minign: true });
        const waveTxn = await favoriteSongsPortalContract.addSong(
          this.state.url,
          { gasLimit: 300000 }
        );
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        this.setState({ minign: false });

        // count = await favoriteSongsPortalContract.getTotalSongs();
        // console.log("Retrieved total wave count...", count.toNumber());
        this.getAllSongs();
        this.getTotal();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      this.setState({ minign: false });
    }
  };

  render = () => {
    let buttonsClasses = "waveButton";
    if (this.state.minign) {
      buttonsClasses += " loading";
    }
    return (
      <div>
        <Head>
          <title>Ether Favorite Songs</title>
          <meta name="title" content="Ether Favorite Songs" />
          <meta
            name="description"
            content="Share your favorite song on Spotify"
          />

          {/* <!-- Facebook --> */}
          <meta property="og:type" content="website" />
          <meta
            property="og:url"
            content="https://ether-favorite-songs.alanhurtarte.repl.co/"
          />
          <meta property="og:title" content="Ether favorite songs" />
          <meta
            property="og:description"
            content="Add your favorite song to the blockchain"
          />
          <meta
            property="og:image"
            content="https://ether-favorite-songs.alanhurtarte.repl.co/social.png"
          />

          {/* <!-- Twitter --> */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta
            property="twitter:url"
            content="https://ether-favorite-songs.alanhurtarte.repl.co/"
          />
          <meta property="twitter:title" content="Ether favorite songs" />
          <meta
            property="twitter:description"
            content="Add your favorite song to the blockchain"
          />
          <meta
            property="twitter:image"
            content="https://ether-favorite-songs.alanhurtarte.repl.co/social.png"
          />
        </Head>
        <div className="mainContainer">
          <div className="dataContainer">
            <div className="header">
              Hello there you human being with super good music taste
            </div>

            <div className="bio">
              Let&apos;s build something great together!. Add your favorite song
              in spotify. <br />
              Let&apos;s build the greatest playlist of all time. Please add a
              valid spotify url.
            </div>

            {this.state.userFound && (
              <>
                <input
                  type="url"
                  name="url"
                  value={this.state.url}
                  onChange={this.handleChange}
                  placeholder="https://open.spotify.com/track/1zdsOgv1hdGGGe9CK1QPY7?si=0a7b6acefd8d4dc5"
                />
                <button className={buttonsClasses} onClick={this.wave}>
                  Share my song to the blockchain!
                </button>
              </>
            )}
            {/*
             * If there is no currentAccount render this button
             */}
            {!this.state.account && (
              <div style={{ textAlign: "center" }}>
                <button className="waveButton" onClick={this.connectWallet}>
                  But first, Connect your Wallet
                </button>
                <p>
                  If your dont know what a wallet its, I recommend you{" "}
                  <a
                    href="https://metamask.io/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    MetaMask
                  </a>
                </p>
              </div>
            )}
            <br />
            <small>
              Note: This project its for learning purposes, so its build on the
              Rinkeby testnet of ethereum. So its using fake Ether. You can
              claim Ether over{" "}
              <a
                href="https://faucet.rinkeby.io/"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
            </small>
            {this.state.minign && (
              <div>
                <br />
                <br />
                <br />
                <strong>Please wait, the magic its happening</strong>
                <div>
                  <iframe
                    src="https://giphy.com/embed/5HSYaZTcRpYnS"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    className="giphy-embed"
                    allowFullScreen
                  ></iframe>
                </div>
                <br />
                <br />
                <br />
              </div>
            )}
            <div>
              <h2 style={{ fontSize: 14 + "px" }}>
                Songs added: {this.state.total}
              </h2>
            </div>
            {this.state.allSongs.map((song, index) => {
              return (
                <div key={index}>
                  <div
                    style={{
                      backgroundColor: "OldLace",
                      marginTop: "16px",
                      padding: "8px",
                    }}
                  >
                    <table border="0">
                      <tbody>
                        <tr>
                          <td style={{ minWidth: "102px" }}>
                            <a
                              rel="noreferrer"
                              href={song.url}
                              target="_blank"
                              style={{ position: "relative", display: "block" }}
                            >
                              <Image
                                src={song.image}
                                width="100px"
                                height="100px"
                                alt=""
                              />
                              <div className="play-icon">
                                <Image
                                  width="30px"
                                  height="30px"
                                  src="/play-icon.png"
                                  alt="play icon"
                                />
                              </div>
                            </a>
                          </td>
                          <td>
                            <a href={song.url} rel="noreferrer" target="_blank">
                              <table>
                                <tbody>
                                  <tr>
                                    <td>
                                      <div>
                                        <strong>{song.name}</strong> ???{" "}
                                        {song.artist}
                                      </div>
                                      <div>
                                        <strong>Added by:</strong>{" "}
                                        <small>{song.contributor}</small>
                                      </div>
                                      <div>
                                        <strong>On:</strong>{" "}
                                        <small>
                                          {song.timestamp.toString()}
                                        </small>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                              <div></div>
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mainContainer">
          <div className="credits">
            <h3>About</h3>
            <p>
              Blockchain app, using solidity and the ethereum blockchain to
              collect the most <br /> awesome music collection. Presented with
              react js and web3 js.
            </p>
            <p>
              Hi, Im Alan Hurtarte, a Lead full stack developer with more than 5
              years of <br />
              professional experiencie. This is my first web3 project. Made with
              ???? from ???????? <br /> <br />
              <a href="https://github.com/kenny08gt">Github</a> |{" "}
              <a href="https://twitter.com/alanhurtarte">Twitter</a> |{" "}
              <a href="https://www.linkedin.com/in/alanhurtarte/">Linkedin</a>{" "}
              <br />
              <br />
              Thanks to @_buildspace. <br />
            </p>
          </div>
        </div>
      </div>
    );
  };
}

export default Home;
