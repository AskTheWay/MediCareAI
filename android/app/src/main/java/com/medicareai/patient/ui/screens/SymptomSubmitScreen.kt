package com.medicareai.patient.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.medicareai.patient.R
import com.medicareai.patient.ui.theme.PrimaryBlue
import com.medicareai.patient.ui.theme.PrimaryPurple
import com.medicareai.patient.viewmodel.SymptomSubmitViewModel
import com.medicareai.patient.viewmodel.UiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SymptomSubmitScreen(
    onNavigateBack: () -> Unit,
    viewModel: SymptomSubmitViewModel = hiltViewModel()
) {
    var symptoms by remember { mutableStateOf("") }
    var duration by remember { mutableStateOf("") }
    var severity by remember { mutableStateOf("") }
    var triggers by remember { mutableStateOf("") }
    var previousDiseases by remember { mutableStateOf("") }
    var shareWithDoctors by remember { mutableStateOf(false) }
    
    val submitState by viewModel.submitState.collectAsState()
    val diagnosisState by viewModel.diagnosisState.collectAsState()
    
    val severities = listOf("轻微", "轻度", "中度", "重度", "严重")
    var expanded by remember { mutableStateOf(false) }
    
    LaunchedEffect(submitState) {
        if (submitState is UiState.Success && diagnosisState is UiState.Success) {
            // Reset form after successful submission
            symptoms = ""
            duration = ""
            severity = ""
            triggers = ""
            previousDiseases = ""
            shareWithDoctors = false
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.symptom_submit)) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Symptom Description
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "症状描述",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedTextField(
                        value = symptoms,
                        onValueChange = { symptoms = it },
                        label = { Text("主要症状（必填）") },
                        placeholder = { Text(stringResource(R.string.symptom_hint)) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        shape = RoundedCornerShape(12.dp),
                        maxLines = 4
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Duration and Severity
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "症状详情",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Duration
                    OutlinedTextField(
                        value = duration,
                        onValueChange = { duration = it },
                        label = { Text("持续时间") },
                        placeholder = { Text("例如：3天、1周") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Severity Dropdown
                    ExposedDropdownMenuBox(
                        expanded = expanded,
                        onExpandedChange = { expanded = it }
                    ) {
                        OutlinedTextField(
                            value = severity,
                            onValueChange = {},
                            label = { Text(stringResource(R.string.severity)) },
                            readOnly = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(),
                            shape = RoundedCornerShape(12.dp),
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                            }
                        )
                        
                        ExposedDropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false }
                        ) {
                            severities.forEach { s ->
                                DropdownMenuItem(
                                    text = { Text(s) },
                                    onClick = {
                                        severity = s
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Additional Information
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "其他信息",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedTextField(
                        value = triggers,
                        onValueChange = { triggers = it },
                        label = { Text("诱因（如果知道）") },
                        placeholder = { Text("例如：接触过敏原、气候变化、运动后等") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        maxLines = 2
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    OutlinedTextField(
                        value = previousDiseases,
                        onValueChange = { previousDiseases = it },
                        label = { Text("既往史相关疾病（可选）") },
                        placeholder = { Text("例如：曾经患过类似症状的疾病") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        maxLines = 2
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Privacy Consent
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "隐私授权",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = shareWithDoctors,
                            onCheckedChange = { shareWithDoctors = it },
                            colors = CheckboxDefaults.colors(checkedColor = PrimaryBlue)
                        )
                        Column {
                            Text(
                                text = "允许将本次诊断信息共享给医生端",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = "勾选后，医生可以查看您的症状、AI诊断结果和上传的检查资料（个人敏感信息如姓名、身份证号等将被自动隐藏）。不勾选则仅您自己可见。",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // Submit Button
            Button(
                onClick = {
                    val title = "AI诊断 - ${severity}"
                    val description = buildString {
                        if (triggers.isNotEmpty()) append("诱因: $triggers")
                        if (previousDiseases.isNotEmpty()) {
                            if (isNotEmpty()) append(" | ")
                            append("既往病史: $previousDiseases")
                        }
                    }
                    viewModel.submitSymptoms(title, symptoms, severity, description)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(12.dp),
                enabled = symptoms.isNotBlank() && submitState !is UiState.Loading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = PrimaryBlue
                )
            ) {
                if (submitState is UiState.Loading || diagnosisState is UiState.Loading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Default.Send, null, modifier = Modifier.padding(end = 8.dp))
                    Text("提交给AI诊断", style = MaterialTheme.typography.titleMedium)
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Reset Button
            OutlinedButton(
                onClick = {
                    symptoms = ""
                    duration = ""
                    severity = ""
                    triggers = ""
                    previousDiseases = ""
                    shareWithDoctors = false
                    viewModel.clearStates()
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Refresh, null, modifier = Modifier.padding(end = 8.dp))
                Text(stringResource(R.string.reset))
            }
            
            // Diagnosis Result
            when (diagnosisState) {
                is UiState.Success -> {
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    val feedback = (diagnosisState as UiState.Success).data
                    
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color(0xFFF0F8FF)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("🤖 ", style = MaterialTheme.typography.titleMedium)
                                Text(
                                    text = stringResource(R.string.ai_diagnosis_result),
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = Color.White
                                )
                            ) {
                                Text(
                                    text = feedback.ai_response.diagnosis,
                                    modifier = Modifier.padding(12.dp),
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            feedback.ai_response.model_id?.let { modelId ->
                                Text(
                                    text = "AI模型: $modelId",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.Gray
                                )
                            }
                        }
                    }
                }
                is UiState.Error -> {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = (diagnosisState as UiState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                else -> {}
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}