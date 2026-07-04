<template>
    <div>
        <div class="head">
            <el-steps :active="step.step" finish-status="success">
                <template v-for="(item,index) in state.steps">
                    <el-step :title="item" />
                </template>
            </el-steps>
        </div>
        <div class="body">
            <el-card shadow="never" v-if="step.step == 1">
                <Common ref="currentDom"></Common>
            </el-card>
            <el-card shadow="never"  v-if="step.step == 2">
                <Server ref="currentDom"></Server>
            </el-card>
            <el-card shadow="never"  v-if="step.step == 3">
                <Client ref="currentDom"></Client>
            </el-card>
            <el-card shadow="never"  v-if="step.step == 4">
                <div class="t-c">{{$t('install.restart')}}</div>
            </el-card>
        </div>
        <div class="footer t-c">
            <el-button :disabled="step.step <= 1" @click="handlePrev">{{$t('install.prev')}}</el-button>
            <el-button v-if="step.step < state.steps.length" type="primary" @click="handleNext">{{$t('install.next')}}</el-button>
            <el-button v-else type="primary" @click="handleSave">{{$t('install.complete')}}</el-button>
        </div>
    </div>
</template>
<script>
import { injectGlobalData } from '@/provide';
import { install } from '@/apis/config';
import { reactive,   ref, provide, computed } from 'vue';
import { ElMessage } from 'element-plus';
import Common from './Common.vue'
import Client from './Client.vue'
import Server from './Server.vue'
import { useI18n } from 'vue-i18n';
export default {
    components: { Common,Client,Server },
    setup(props) {

        const {t} = useI18n();
        const globalData = injectGlobalData();
        const state = reactive({
            steps:computed(()=>[t('install.mode'), globalData.value.isPc ? t('install.server') : '',t('install.client'),t('install.complete')])
        });

        const currentDom = ref(null);
        const step = ref({
            step:1,
            increment:1,
            json:{},
            form:{server:{},client:{},common:{}}
        });
        provide('step',step);
        const handlePrev = ()=>{
            step.value.step --;
            step.value.increment = -1;
        }
        const handleNext = ()=>{
            step.value.increment = 1;
            currentDom.value.handleValidate().then((json)=>{
                step.value.json = Object.assign(step.value.json,json.json);
                step.value.form = Object.assign(step.value.form,json.form);
                step.value.step ++;
            }).catch(()=>{
            });
        }
        const handleSave = ()=>{
            install(step.value.json).then(()=>{
                ElMessage.success(t('common.opered'));
                window.location.reload();
            }).catch(()=>{
                ElMessage.error(t('common.operFail'));
            })
        }

        return { state,currentDom,step,handlePrev,handleNext,handleSave};
    }
}
</script>
<style lang="stylus" scoped>
.body{margin-top:1rem;}
.footer{
    margin-top:2rem
}
</style>