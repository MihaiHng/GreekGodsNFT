import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect, disconnect } from "./redux/blockchain/blockchainActions";
import { fetchData } from "./redux/data/dataActions";
import * as s from "./styles/globalStyles";
import styled from "styled-components";

export const StyledButton = styled.button`
  padding: 10px;
  border-radius: 20px;
  border: none;
  background-color: #ced1ff;
  font-weight: bold;
  color: #ffffff;
  width: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-Shadow: 0px 5px 11px 2px rgba(0,0,0,0.35);
  &:hover {
    background-color: #6c73d2; /* New background color on hover */
  }
  span {
    margin-right: 8px; /* Adjust as needed for spacing */
  }
  opacity: ${props => (props.disabled ? 0.6 : 1)};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
`;

export const StyledConnectButton = styled.button`
  padding: 10px;
  border-radius: 20px;
  border: 3px solid #222222;
  background-color: #4555a2;
  opacity: 0.6;
  font-weight: bold;
  color: #ffffff;
  width: 200px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-Shadow: 0px 5px 11px 2px rgba(0,0,0,0.35);
  &:hover {
    background-color: #6c73d2; /* New background color on hover */
    color: #333333; /* New text color on hover */
  }
`;

export const StyledMintButton = styled.button`
  padding: 10px;
  border-radius: 20px;
  border: none;
  background-color: #f6b261;
  font-weight: bold;
  color: #ffffff;
  width: 200px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-Shadow: 0px 5px 11px 2px rgba(0,0,0,0.35);
  &:hover {
    background-color: #ed6a04; /* New background color on hover */
    color: #333333; /* New text color on hover */
  }
`;

export const StyledLogo = styled.img`
  width: 200px;
  @media (min-width: 767px) {
    width: 200px;
  }
  transition: width 0.5s;
  transition: height 0.5s;
`;

export const StyledImg = styled.img`
  box-shadow: 0px 5px 11px 2px rgba(0, 0, 0, 0.7);
  border: 5px solid #222222;
  background-color: var(--accent);
  border-radius: 50%;
  width: 400px;
  height: auto;
`;

export const StyledLink = styled.a`
  color: #bdc967;
  text-decoration: none;
`;

function App() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [feedback, setFeedback] = useState(`Click "Buy" to mint your NFT.`);
  const mintAmount = 1;
  const mintCap = 1;
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const [copyButtonText, setCopyButtonText] = useState("Contract Address");
  const [copyButtonDisabled, setCopyButtonDisabled] = useState(false);

  const claimNFTs = async () => {
    // Check if the mint limit per wallet is reached before attempting to mint
    const mintedAmount = await blockchain.smartContract.methods
    .addressMintedBalance(blockchain.account)
    .call();

    if (mintedAmount >= mintCap) {  // Check against your minting limit
    setFeedback("There is a limit of 1 NFT/wallet. You have already acquired one.");
    return;
    }

    let cost = CONFIG.WEI_COST;
    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    console.log("Cost: ", totalCostWei);
    console.log("Gas limit: ", totalGasLimit);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}...`);
    setClaimingNft(true);
      try {
        // Try minting NFTs by interacting with the smart contract
        await blockchain.smartContract.methods
          .mint(blockchain.account, mintAmount)
          .send({
            gasLimit: String(totalGasLimit),
            to: CONFIG.CONTRACT_ADDRESS,
            from: blockchain.account,
            value: totalCostWei,
          });
    
        // Minting was successful
        setFeedback(`Congratulations! One ${CONFIG.NFT_NAME} is now in your wallet! Visit testnets.opensea.io to see it.`);
        dispatch(fetchData(blockchain.account));
      } catch (error) {
        // Handle different errors 
        console.error('Error during minting:', error);
    
        // Check for user-rejected error
        if (error.code === 4001) {
          setFeedback("Transaction canceled by user. Please try again.");
        } else {
          // Handle other potential errors
          setFeedback("Sorry, something went wrong. Please try again later.");
        }
      } finally {
        // Reset the state regardless of the outcome
        setClaimingNft(false);
      }
     
  };

  const getData = () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  const handleCopyClick = () => {
    navigator.clipboard.writeText(CONFIG.CONTRACT_ADDRESS).then(() => {
      setCopyButtonText("Copied!");
      setCopyButtonDisabled(true);

      setTimeout(() => {
        setCopyButtonText("Contract Address");
        setCopyButtonDisabled(false);
      }, 1000);
    });
  };
  
  return (
      <s.Body>
        <s.BigContainer>
          <s.LeftContainer 
            style={{ padding: 25 }}
          >
            <s.Container
              ai={"center"}
            > 
              <a href={CONFIG.MARKETPLACE_LINK}>
                <StyledLogo alt={"logo"} src={"/config/images/logo.png"} />
              </a>
            </s.Container>
            <s.SpacerSmall />
            <s.Container
              jc={"center"}
              ai={"center"}
              style={{
                backgroundColor: "var(--accent)",
                padding: 1,
                borderRadius: 24,
                border: "5px solid #222222",
                boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
              }}
            >
             <s.SpacerSmall />  
             {blockchain.account === "" || blockchain.smartContract === null ? (
              <>
                <StyledConnectButton
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(connect());
                    getData();
                  }}
                 >
                  CONNECT
                </StyledConnectButton>
              </>
              ) : (
               <>
                  <StyledConnectButton
                    style={{
                      background: "#db3b3b"
                    }}
                    onClick={(e) => {
                    e.preventDefault();
                    dispatch(disconnect());
                    blockchain.account = null;
                    blockchain.web3 = null;
                    blockchain.smartContract = null;
                    }}
                  >
                    DISCONNECT
                  </StyledConnectButton>
               </>
              )}
            <s.SpacerSmall />
            <s.Container
              jc={"center"}
              ai={"center"}
              style={{
                width: "300px",
                backgroundColor: "#bdc966",
                padding: 1,
                borderRadius: 24,
                border: "5px solid #bdc966",
                boxShadow: "0px 5px 11px 2px rgba(0,0,0,0.7)",
              }}
            > 
              <s.TextTitle
                style={{
                  textAlign: "center",
                  fontSize: 50,
                  fontWeight: "bold",
                  color: "var(--accent-text)",
                }}
              >
                {data.totalSupply} / {CONFIG.MAX_SUPPLY}
              </s.TextTitle>
              {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
                <>
                  <s.TextTitle
                    style={{ textAlign: "center", color: "var(--accent-text)" }}
                  >
                    The sale has ended.
                  </s.TextTitle>
                </>
              ) : (
                <>
                  <s.TextTitle
                    style={{ textAlign: "center", color: "var(--accent-text)"}}
                  >
                    MINT PRICE : {CONFIG.DISPLAY_COST}{" "}{CONFIG.NETWORK.SYMBOL}
                  </s.TextTitle>
                </>
              )} 
              <s.SpacerXSmall />    
            </s.Container> 
            <s.SpacerSmall />   
            {blockchain.account === "" || blockchain.smartContract === null ? (
                <s.Container ai={"center"} jc={"center"}>
                  <s.TextDescription
                    style={{
                      textAlign: "center",
                      color: "var(--accent-text)",
                    }}
                  >
                    Connect to the {CONFIG.NETWORK.NAME} network
                  </s.TextDescription>
                  <s.SpacerSmall />                 
                  {blockchain.errorMsg !== "" ? (
                    <>
                      <s.SpacerSmall />
                      <s.TextDescription
                        style={{
                          textAlign: "center",
                          color: "var(--accent-text)",
                        }}
                      >
                        {blockchain.errorMsg}
                      </s.TextDescription>
                    </>
                  ) : null}
                  <s.SpacerLarge />
                </s.Container>
              ) : (
                <>
                  <s.TextDescription
                    style={{
                      textAlign: "center",
                      color: "var(--accent-text)",
                    }}
                  >
                    {feedback}
                  </s.TextDescription>
                  <s.SpacerSmall />
                  <s.Container ai={"center"} jc={"center"} fd={"column"}>
                    <StyledMintButton
                      style={{
                        margin: "5px",
                      }}
                      disabled={claimingNft ? 1 : 0}
                      onClick={(e) => {
                        e.preventDefault();
                        claimNFTs();
                        getData();
                      }}
                    >
                      {claimingNft ? "BUSY" : "BUY"}
                    </StyledMintButton>
                  </s.Container>
                  <s.SpacerSmall/>
                </>
              )}
              <s.SpacerSmall/>
              <s.Container
                jc={"center"}
                ai={"center"}
                fd={"row"}
              >
                <StyledButton
                  onClick={handleCopyClick}
                  disabled={copyButtonDisabled}
                  className="copy"
                  style={{
                  margin: "5px"
                  }}
                >
                    <span>{copyButtonText}</span>
                    <ion-icon name="copy-outline" class="copy-icon" size="small"></ion-icon>
                </StyledButton>
                <StyledButton
                    style={{
                      margin: "5px",
                      width: 100
                    }}
                    onClick={(e) => {
                      window.open(CONFIG.MARKETPLACE_LINK, "_blank");
                    }}
                >
                    {CONFIG.MARKETPLACE}
                </StyledButton>
                <StyledButton
                    style={{
                      margin: "5px",
                      width: 100
                    }}
                    onClick={(e) => {
                      window.open(CONFIG.SCAN_LINK, "_blank");
                    }}
                >
                    Scan
                </StyledButton>
              </s.Container>
              <s.SpacerSmall />
            </s.Container>
          </s.LeftContainer>
          <s.RightContainer>
            <s.Container  jc={"center"} ai={"center"} >
              <StyledImg alt={"example"} src={"/config/images/example.gif"} />
            </s.Container>
          </s.RightContainer>
        </s.BigContainer>  
      </s.Body>
  );
}
export default App;
