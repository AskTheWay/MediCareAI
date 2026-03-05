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
import com.medicareai.patient.viewmodel.ProfileViewModel
import com.medicareai.patient.viewmodel.UiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val profileState by viewModel.profileState.collectAsState()
    val updateState by viewModel.updateState.collectAsState()
    
    var isEditing by remember { mutableStateOf(false) }
    
    // Form fields
    var fullName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }
    var dateOfBirth by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var emergencyContact by remember { mutableStateOf("") }
    
    LaunchedEffect(Unit) {
        viewModel.loadProfile()
    }
    
    LaunchedEffect(profileState) {
        if (profileState is UiState.Success) {
            val patient = (profileState as UiState.Success).data
            fullName = patient.user_full_name
            phone = patient.phone ?: ""
            gender = patient.gender ?: ""
            dateOfBirth = patient.date_of_birth ?: ""
            address = patient.address ?: ""
            emergencyContact = patient.emergency_contact ?: ""
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.profile)) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                },
                actions = {
                    if (profileState is UiState.Success) {
                        IconButton(onClick = { isEditing = !isEditing }) {
                            Icon(
                                if (isEditing) Icons.Default.Close else Icons.Default.Edit,
                                null
                            )
                        }
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (profileState) {
                is UiState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is UiState.Error -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = (profileState as UiState.Error).message,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.loadProfile() }) {
                            Text("重试")
                        }
                    }
                }
                is UiState.Success -> {
                    val patient = (profileState as UiState.Success).data
                    
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp)
                    ) {
                        // Avatar Section
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Surface(
                                    shape = androidx.compose.foundation.shape.CircleShape,
                                    color = PrimaryBlue.copy(alpha = 0.1f),
                                    modifier = Modifier.size(100.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = patient.user_full_name.firstOrNull()?.toString() ?: "患",
                                            style = MaterialTheme.typography.displayLarge,
                                            color = PrimaryBlue
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                Text(
                                    text = patient.user_full_name,
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold
                                )
                                
                                Text(
                                    text = "患者 ID: ${patient.id.take(8)}...",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color.Gray
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Profile Information
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                if (updateState is UiState.Success) {
                                    Text(
                                        text = "更新成功",
                                        color = Color(0xFF28a745),
                                        modifier = Modifier.padding(bottom = 8.dp)
                                    )
                                }
                                
                                ProfileField(
                                    label = "姓名",
                                    value = fullName,
                                    onValueChange = { fullName = it },
                                    icon = Icons.Default.Person,
                                    enabled = isEditing
                                )
                                
                                ProfileField(
                                    label = "邮箱",
                                    value = patient.user_id,
                                    onValueChange = {},
                                    icon = Icons.Default.Email,
                                    enabled = false
                                )
                                
                                ProfileField(
                                    label = "性别",
                                    value = gender,
                                    onValueChange = { gender = it },
                                    icon = Icons.Default.PersonOutline,
                                    enabled = isEditing
                                )
                                
                                ProfileField(
                                    label = "出生日期",
                                    value = dateOfBirth,
                                    onValueChange = { dateOfBirth = it },
                                    icon = Icons.Default.CalendarToday,
                                    enabled = isEditing,
                                    placeholder = "YYYY-MM-DD"
                                )
                                
                                ProfileField(
                                    label = "手机号码",
                                    value = phone,
                                    onValueChange = { phone = it },
                                    icon = Icons.Default.Phone,
                                    enabled = isEditing
                                )
                                
                                ProfileField(
                                    label = "地址",
                                    value = address,
                                    onValueChange = { address = it },
                                    icon = Icons.Default.LocationOn,
                                    enabled = isEditing
                                )
                                
                                ProfileField(
                                    label = "紧急联系人",
                                    value = emergencyContact,
                                    onValueChange = { emergencyContact = it },
                                    icon = Icons.Default.ContactPhone,
                                    enabled = isEditing
                                )
                            }
                        }
                        
                        if (isEditing) {
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Button(
                                onClick = {
                                    viewModel.updateProfile(
                                        com.medicareai.patient.data.model.PatientUpdateRequest(
                                            gender = gender.takeIf { it.isNotEmpty() },
                                            phone = phone.takeIf { it.isNotEmpty() },
                                            address = address.takeIf { it.isNotEmpty() },
                                            emergency_contact = emergencyContact.takeIf { it.isNotEmpty() }
                                        )
                                    )
                                    isEditing = false
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                if (updateState is UiState.Loading) {
                                    CircularProgressIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(24.dp)
                                    )
                                } else {
                                    Text("保存修改")
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }
                else -> {}
            }
        }
    }
}

@Composable
private fun ProfileField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    enabled: Boolean,
    placeholder: String = ""
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        leadingIcon = { Icon(icon, null, tint = PrimaryBlue) },
        enabled = enabled,
        placeholder = { Text(placeholder) },
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        singleLine = true
    )
}