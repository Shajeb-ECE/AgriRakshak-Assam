import React, {useEffect, useState} from "react";
import {ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View} from "react-native";
// Android emulator: 10.0.2.2 | iOS simulator: 127.0.0.1 | phone: computer LAN IP
const API = "http://10.0.2.2:8000";
type Item = {id:number; field_name:string; crop:string; verification_status:string};
export default function App() {
  const [items,setItems] = useState<Item[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  useEffect(() => {
    fetch(API + "/observations").then(r => {if(!r.ok) throw new Error("API error"); return r.json();})
      .then(setItems).catch(e => setError(e.message + " — check API address/backend."))
      .finally(() => setLoading(false));
  }, []);
  return <SafeAreaView style={s.page}>
    <Text style={s.title}>AgriRakshak Assam</Text>
    <Text style={s.sub}>Field observations • Phase 1</Text>
    {loading && <ActivityIndicator />}
    {!!error && <Text style={s.error}>{error}</Text>}
    {!loading && !error && <FlatList data={items} keyExtractor={x=>String(x.id)}
      ListEmptyComponent={<Text>No records yet. Add them from the web dashboard.</Text>}
      renderItem={({item})=><View style={s.card}>
        <Text style={s.field}>{item.field_name}</Text>
        <Text>Crop: {item.crop}</Text><Text>Verification: {item.verification_status}</Text>
      </View>} />}
    <Text style={s.note}>Demo app; scores are not diagnoses or validated forecasts.</Text>
  </SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:"#f4f8f1",padding:20,paddingTop:48},
title:{fontSize:27,fontWeight:"700",color:"#245b38"},sub:{marginVertical:16,color:"#526052"},
card:{backgroundColor:"white",padding:15,borderRadius:12,marginBottom:10},
field:{fontSize:17,fontWeight:"600"},error:{color:"red"},note:{fontSize:11,color:"#667",padding:10}});
