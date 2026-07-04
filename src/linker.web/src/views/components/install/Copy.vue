<template>
    <div>
        <div>
            <el-input v-trim v-model="state.content" type="textarea" :rows="10" resize="none"></el-input>
        </div>
        <div class="t-c mgt-1">
            <el-button type="primary" @click="handleSave">{{$t('common.confirm')}}</el-button>
        </div>
    </div>
</template>

<script>
import { installCopy } from '@/apis/config';
import { ElMessage } from 'element-plus';
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
    setup () {
        const {t} = useI18n();
        const state = reactive({ content:'' })
        const handleSave = ()=>{
            if(!state.content) return;
            installCopy(state.content).then((res)=>{
                if(!res){
                    ElMessage.error(t('common.operFail'));
                    return;
                }
                ElMessage.success(t('common.opered'));
                window.location.reload();
            }).catch(()=>{
                ElMessage.error(t('common.operFail'));
            })
        }
        return {
            state,handleSave
        }
    }
}
</script>

<style lang="stylus" scoped>
</style>