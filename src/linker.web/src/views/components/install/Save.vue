<template>
    <div>
        <el-form ref="formDom" :model="state.ruleForm" :rules="state.rules" label-width="auto">
            <el-form-item :label="$t('install.save.server')" prop="server">
                <el-input v-trim v-model="state.ruleForm.server" />
            </el-form-item>
            <el-form-item :label="$t('install.save.pwd')" prop="value">
                <el-input v-trim v-model="state.ruleForm.value" />
            </el-form-item>
            <el-form-item label="" prop="Btns">
                <div class="t-c w-100">
                    <el-button type="primary" @click="handleSave">{{$t('common.confirm')}}</el-button>
                </div>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import { installSave } from '@/apis/config';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
    setup () {
        const { t } = useI18n();
        const state = reactive({ 
            ruleForm: {
                server: '',
                value:'',
            },
            rules: {
                server: [{ required: true, message: t('install.required'), trigger: "blur" }],
                value: [{ required: true, message: t('install.required'), trigger: "blur" }],
            }
        })
        const formDom = ref(null);
        const handleSave = ()=>{
            formDom.value.validate((valid) => {
                if (!valid) return;
                installSave(state.ruleForm).then((res)=>{
                    if(!res){
                        ElMessage.success(t('common.operFail'));
                        return;
                    }
                    ElMessage.success(t('common.opered'));
                    window.location.reload();
                }).catch(()=>{
                    ElMessage.success(t('common.operFail'));
                })
            });
        }
        return {
            state,formDom,handleSave
        }
    }
}
</script>

<style lang="stylus" scoped>
</style>