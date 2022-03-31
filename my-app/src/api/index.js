import axios from "axios";

export const host = "http://localhost:9000";

export const API = axios.create({ baseURL: host });

export const fetchDetail =async (signedDeployJSON) => API.post(host + "/", { signedDeployJSON });
export const fetchBalance = async(publicKey) => API.post(host + "/balance", { publicKey });