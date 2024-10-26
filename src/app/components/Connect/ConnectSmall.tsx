import Cosmos from "@ledgerhq/hw-app-cosmos";
import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";
import CosmosApp from "@zondax/ledger-cosmos-js";
import { AppClient, DefaultWalletPolicy } from "ledger-bitcoin";
import { useRef, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FaBitcoin } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { PiWalletBold } from "react-icons/pi";
import { Tooltip } from "react-tooltip";
import { useOnClickOutside } from "usehooks-ts";

import { useHealthCheck } from "@/app/hooks/useHealthCheck";
import { getNetworkConfig } from "@/config/network.config";
import { satoshiToBtc } from "@/utils/btcConversions";
import { maxDecimals } from "@/utils/maxDecimals";
import { trim } from "@/utils/trim";

import { Hash } from "../Hash/Hash";
import { LoadingSmall } from "../Loading/Loading";

interface ConnectSmallProps {
  loading?: boolean;
  onConnect: () => void;
  address: string;
  btcWalletBalanceSat?: number;
  onDisconnect: () => void;
}

export const ConnectSmall: React.FC<ConnectSmallProps> = ({
  loading = false,
  onConnect,
  address,
  btcWalletBalanceSat,
  onDisconnect,
}) => {
  const onConnectLedgerBabylon = async () => {
    //alert("Connect to Ledger");

    const transport = await TransportWebBLE.create();

    const cosmos = new CosmosApp(transport);
    const hwCosmos = new Cosmos(transport);
    const signer = {
      getAddressAndPubKey: cosmos.getAddressAndPubKey.bind(cosmos),
      sign: cosmos.sign.bind(cosmos),
      getAddress: hwCosmos.getAddress.bind(hwCosmos),
    };
    const { address, publicKey } = await signer.getAddress(
      "44'/118'/0'/0/0",
      "bbn", // prefix for babylon chain
      true,
    );
    console.log("First babylon account address:", address);
    setBabylonaddress(address);
  };

  const onConnectLedgerBtc = async () => {
    //alert("Connect to Ledger");

    const transport = await TransportWebBLE.create();
    const app = new AppClient(transport);
    console.log("Connect to Ledger");

    const fpr = await app.getMasterFingerprint();
    //console.log("Master key fingerprint:", fpr.toString("hex"));

    // ==> Get and display on screen the first taproot address
    const firstTaprootAccountPubkey =
      await app.getExtendedPubkey("m/86'/1'/0'");
    const firstTaprootAccountPolicy = new DefaultWalletPolicy(
      "tr(@0/**)",
      `[${fpr}/86'/1'/0']${firstTaprootAccountPubkey}`,
    );

    const firstTaprootAccountAddress = await app.getWalletAddress(
      firstTaprootAccountPolicy,
      null,
      0,
      0,
      true, // show address on the wallet's screen
    );

    console.log("First taproot account address:", firstTaprootAccountAddress);
    setBtcaddress(firstTaprootAccountAddress);
  };

  const [showMenu, setShowMenu] = useState(false);
  const [babylonaddress, setBabylonaddress] = useState("");
  const [btcaddress, setBtcaddress] = useState("");
  const handleClickOutside = () => {
    setShowMenu(false);
  };

  const ref = useRef(null);
  useOnClickOutside(ref, handleClickOutside);

  const { coinName, networkName } = getNetworkConfig();
  const { isApiNormal, isGeoBlocked, apiMessage } = useHealthCheck();

  // Renders the Tooltip describing the reason
  // why the user might not be able to connect the wallet
  const renderApiNotAvailableTooltip = () => {
    if (!isGeoBlocked && isApiNormal) return null;

    return (
      <>
        <span
          className="cursor-pointer text-xs"
          data-tooltip-id="tooltip-connect"
          data-tooltip-content={apiMessage}
          data-tooltip-place="bottom"
        >
          <AiOutlineInfoCircle />
        </span>
        <Tooltip id="tooltip-connect" className="tooltip-wrap" />
      </>
    );
  };

  return address ? (
    <div className="relative mr-[-10px] text-sm hidden md:flex" ref={ref}>
      <button
        className="flex cursor-pointer outline-none items-stretch"
        onClick={() => setShowMenu(!showMenu)}
      >
        {(typeof btcWalletBalanceSat === "number" || loading) && (
          <div className="flex items-center rounded-lg border border-base-200/75 p-2 pr-4">
            <div className="flex items-center gap-1">
              <FaBitcoin className="text-primary" />
              {typeof btcWalletBalanceSat === "number" && (
                <p>
                  <strong>
                    {maxDecimals(satoshiToBtc(btcWalletBalanceSat), 8)}{" "}
                    {coinName}
                  </strong>
                </p>
              )}
              {loading && <LoadingSmall text="Loading..." />}
            </div>
          </div>
        )}
        <div
          className="relative right-[10px] flex items-center rounded-lg border border-primary bg-[#fdf2ec] p-2 dark:border-white dark:bg-base-200"
          data-testid="address"
        >
          {trim(address)}
        </div>
      </button>
      {showMenu && (
        <div
          className="absolute right-[10px] top-0 z-10 mt-[4.5rem] flex flex-col gap-4 rounded-lg bg-base-300 p-4 shadow-lg"
          style={{
            // margin - border
            width: "calc(100% - 8px)",
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold dark:text-neutral-content">Settings</h3>
            <button
              className="btn btn-circle btn-ghost btn-sm"
              onClick={() => setShowMenu(false)}
            >
              <IoMdClose size={24} />
            </button>
          </div>
          <div className="flex flex-col">
            <Hash value={address} address noFade fullWidth />
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setShowMenu(false);
              onDisconnect();
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-1">
      <div className="mb-[0px]">
        <button
          className="btn-primary btn h-[2.5rem] min-h-[2.5rem] rounded-full px-2 text-white md:rounded-lg"
          onClick={onConnectLedgerBabylon}
        >
          <PiWalletBold size={20} className="flex md:hidden" />
          <span className="hidden md:flex">
            Connect to babylon testnet network
          </span>
        </button>

        <button
          className="btn-primary btn h-[2.5rem] min-h-[2.5rem] rounded-full px-2 text-white md:rounded-lg mt-[40px]"
          onClick={onConnectLedgerBtc}
        >
          <span className="hidden md:flex">
            Connect to bitcoin testnet network
          </span>
        </button>
      </div>
      <div className="mt-[0px]">
        <div className="border border-white rounded-lg">{babylonaddress}</div>
        <div className="mt-[40px] border border-white rounded-lg">
          {btcaddress}
        </div>
      </div>
      {!isApiNormal && renderApiNotAvailableTooltip()}
    </div>
  );
};
