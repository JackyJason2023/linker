<template>
    <div class="wrap">
        <el-form ref="ruleFormRef" :model="state.ruleForm" :rules="state.rules" label-width="8rem">
            <el-form-item :label="$t('tuntap.id')" prop="Guid" v-if="state.showGuid">
                <el-input v-trim v-model="state.ruleForm.Guid" class="w-14" disabled />
                <el-button  @click="handleNewId" class="mgl-1"><el-icon><Refresh></Refresh></el-icon></el-button>
            </el-form-item>
            <el-form-item :label="$t('tuntap.name')" prop="Name">
                <el-input v-trim v-model="state.ruleForm.Name" class="w-14" />
                <span class="mgl-1">{{ $t('tuntap.empty') }}</span>
            </el-form-item>
            <el-form-item label="MTU" prop="MTU">
                <el-select v-model="state.ruleForm.Mtu" class="w-14">
                    <el-option :value="item.value" :label="item.label" v-for="(item,index) in state.mtus"></el-option>
                </el-select>
                <span class="mgl-1">{{ $t('tuntap.empty') }}</span>
            </el-form-item>
            <el-form-item :label="$t('tuntap.mss')" prop="MssFix">
                <el-select v-model="state.ruleForm.MssFix" class="w-14">
                    <el-option :value="item.value" :label="item.label" v-for="(item,index) in state.msss"></el-option>
                </el-select>
                <span class="mgl-1">{{ $t('tuntap.empty') }}</span>
            </el-form-item>
            <el-form-item :label="$t('tuntap.subnet')" prop="NetworkName">
                <el-select v-model="state.ruleForm.NetworkName"  class="w-14">
                    <el-option :value="item.value" :label="item.label" v-for="(item,index) in state.networks"></el-option>
                </el-select>
                <span class="mgl-1">{{$t('tuntap.subnetText')}}</span>
            </el-form-item>
            <el-form-item :label="$t('tuntap.segment')" prop="VlsmStatus">
                <el-select v-model="state.ruleForm.VlsmStatus" class="w-14">
                    <el-option :value="item.value" :label="item.label" v-for="(item,index) in state.vlsms"></el-option>
                </el-select>
                <span class="mgl-1">{{ $t('tuntap.empty') }}</span>
            </el-form-item>
            <el-form-item :label="$t('tuntap.ip')" prop="IP">
                <el-input v-trim v-model="state.ruleForm.IP" class="w-14" />
                <span> / </span>
                <el-input v-trim @change="handlePrefixLengthChange" v-model="state.ruleForm.PrefixLength" class="w-4" />
            </el-form-item>
            <el-form-item label="" class="mgb-0">
                    <el-checkbox class="mgr-1" v-model="state.ruleForm.ShowDelay" :label="$t('tuntap.delay')" size="large" />
                    <el-checkbox class="mgr-1" v-model="state.ruleForm.AutoConnect" :label="$t('tuntap.auto')" size="large" />
                    <el-checkbox class="mgr-1" v-model="state.ruleForm.Multicast" :label="$t('tuntap.multicast')" size="large" />
                    <el-checkbox class="mgr-1" v-model="state.ruleForm.DisableNat" :label="$t('tuntap.nat')" size="large" />
                    <el-checkbox class="mgr-1" v-model="state.ruleForm.InterfaceOrder" :label="$t('tuntap.order')" size="large" />
                    <el-checkbox class="mgr-1" v-model="state.ruleForm.SrcProxy" :label="$t('tuntap.srcProxy')" size="large" />
            </el-form-item>
        </el-form>
    </div>
</template>
<script>
import { onMounted, reactive, ref} from 'vue';
import { useTuntap } from './tuntap';
import TuntapForward from './TuntapForward.vue'
import TuntapLan from './TuntapLan.vue'
import { Delete, Plus, Warning, Refresh } from '@element-plus/icons-vue'
import { getid, getNetwork, setid } from '@/apis/tuntap';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
export default {
    emits: ['change'],
    components: { Delete, Plus, Warning, Refresh,TuntapForward ,TuntapLan},
    setup(props, { emit }) {
        

        const {t} = useI18n();
        const tuntap = useTuntap();

        const ruleFormRef = ref(null);
        const state = reactive({
            showGuid:tuntap.value.current.systems.indexOf('windows') >= 0,
            ruleForm: {
                IP: tuntap.value.current.IP,
                PrefixLength: tuntap.value.current.PrefixLength || 24,
                Gateway: tuntap.value.current.Gateway,
                ShowDelay: tuntap.value.current.ShowDelay,
                AutoConnect: tuntap.value.current.AutoConnect,
                Upgrade: tuntap.value.current.Upgrade,
                Multicast: tuntap.value.current.Multicast,
                DisableNat: tuntap.value.current.DisableNat,
                TcpMerge: tuntap.value.current.TcpMerge,
                InterfaceOrder: tuntap.value.current.InterfaceOrder,
                FakeAck: tuntap.value.current.FakeAck,
                SrcProxy: tuntap.value.current.SrcProxy,
                Forwards: tuntap.value.current.Forwards,
                Name: tuntap.value.current.Name,
                NetworkName: tuntap.value.current.NetworkName,
                Mtu: tuntap.value.current.Mtu,
                MssFix: tuntap.value.current.MssFix,
                VlsmStatus: tuntap.value.current.VlsmStatus,
                Guid: '',
            },
            rules: {
                Name: {
                    type: 'string',
                    pattern: /^$|^[A-Za-z][A-Za-z0-9]{0,31}$/,
                    message:t('tuntap.validate'),
                    transform(value) {
                        return value.trim();
                    },
                }
            },
            networks:[],
            vlsms:[
                {value:0,label:''},
                {value:1,label:`${t('tuntap.master')} <-/->${t('tuntap.subnet')}`},
                {value:2,label:`${t('tuntap.master')}  -->${t('tuntap.subnet')}`},
                {value:4,label:`${t('tuntap.master')} <--> ${t('tuntap.subnet')}`},
            ],
            mtus:[
                {value:0,label:''},
                {value:1480,label:'1480'},
                {value:1460,label:'1460'},
                {value:1440,label:'1440'},
                {value:1420,label:'1420'},
                {value:1400,label:'1400'},
                {value:1380,label:'1380'},
                {value:1360,label:'1360'},
                {value:1340,label:'1340'},
                {value:1320,label:'1320'},
                {value:1300,label:'1300'},
                {value:1280,label:'1280'},
                {value:1260,label:'1260'},
                {value:1240,label:'1240'},
                {value:1220,label:'1220'},
                {value:1200,label:'1200'}
            ],
            msss:[
                {value:0,label:''},
                {value:1,label:''},
                {value:2,label:''},
                {value:3,label:''},
                {value:4,label:''},
                {value:5,label:''},
                {value:6,label:t('tuntap.unset')},
                {value:7,label:t('tuntap.clamp')},
                {value:1400,label:'1400'},
                {value:1380,label:'1380'},
                {value:1360,label:'1360'},
                {value:1340,label:'1340'},
                {value:1320,label:'1320'},
                {value:1300,label:'1300'},
                {value:1280,label:'1280'},
                {value:1260,label:'1260'},
                {value:1240,label:'1240'},
                {value:1220,label:'1220'},
                {value:1200,label:'1200'}
            ]
        });
        const handlePrefixLengthChange = () => {
            var value = +state.ruleForm.PrefixLength;
            if (value > 32 || value < 16 || isNaN(value)) {
                value = 24;
            }
            state.ruleForm.PrefixLength = value;
        }
        const handleNewId = () => {
            state.ruleForm.Guid =  crypto.randomUUID();
            setid({key:tuntap.value.current.device.MachineId,value:state.ruleForm.Guid}).then(res=>{ 
                ElMessage.success(t('common.opered'))
            }).catch(()=>{
                ElMessage.error(t('common.operFail'));
            });
        }

        const getData = ()=>{
            const json = JSON.parse(JSON.stringify(tuntap.value.current,(key,value)=> key =='device'?'':value ));
            json.IP = state.ruleForm.IP.replace(/\s/g, '') || '0.0.0.0';
            json.PrefixLength = +state.ruleForm.PrefixLength;
            json.Gateway = state.ruleForm.Gateway;
            json.ShowDelay = state.ruleForm.ShowDelay;
            json.AutoConnect = state.ruleForm.AutoConnect;
            json.Upgrade = state.ruleForm.Upgrade;
            json.Multicast = state.ruleForm.Multicast;
            json.DisableNat = state.ruleForm.DisableNat;
            json.TcpMerge = state.ruleForm.TcpMerge;
            json.InterfaceOrder = state.ruleForm.InterfaceOrder;
            json.FakeAck = state.ruleForm.FakeAck;
            json.SrcProxy = state.ruleForm.SrcProxy;
            json.Name = state.ruleForm.Name;
            json.NetworkName = state.ruleForm.NetworkName;
            json.Mtu = state.ruleForm.Mtu;
            json.MssFix = state.ruleForm.MssFix;
            json.VlsmStatus = state.ruleForm.VlsmStatus;

            return json;
        }

        onMounted(()=>{
            getid(tuntap.value.current.device.MachineId).then(res=>{
                state.ruleForm.Guid = res;
            });
            getNetwork().then(res=>{
                state.networks = [{value:'default',label:t('tuntap.master')}]
                .concat(res.Subs.reduce((a,b)=>a.concat([{value:b.Name,label:`${b.Name}->${b.IP}/${b.PrefixLength}`}]),[]));
            });
        })

        return {
            state, ruleFormRef, handlePrefixLengthChange,handleNewId,getData
        }
    }
}
</script>
<style lang="stylus" scoped>
.el-switch.is-disabled{opacity :1;}
.wrap{min-height:40rem;}
</style>