from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Perfil, HistorialAccion

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        try:
            token['rol'] = user.perfil.rol
        except Perfil.DoesNotExist:
            token['rol'] = 'capturista' # Default fallback
            
        # Log the login action
        HistorialAccion.objects.create(
            user=user,
            accion="Login",
            detalles=f"El usuario {user.username} inició sesión en el sistema."
        )
        
        return token

class HistorialAccionSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='user.username', read_only=True)
    usuario_rol = serializers.SerializerMethodField()

    class Meta:
        model = HistorialAccion
        fields = ('id', 'usuario_nombre', 'usuario_rol', 'accion', 'detalles', 'fecha')

    def get_usuario_rol(self, obj):
        if obj.user and hasattr(obj.user, 'perfil'):
            return obj.user.perfil.get_rol_display()
        return 'Desconocido'

class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'rol', 'avatar')

    def get_rol(self, obj):
        try:
            return obj.perfil.rol
        except Perfil.DoesNotExist:
            return 'capturista'

    def get_avatar(self, obj):
        try:
            return obj.perfil.avatar
        except Perfil.DoesNotExist:
            return 'User'

class ProfileUpdateSerializer(serializers.ModelSerializer):
    avatar = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'password', 'avatar')

    def update(self, instance, validated_data):
        avatar = validated_data.pop('avatar', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()

        if avatar:
            perfil, created = Perfil.objects.get_or_create(user=instance)
            perfil.avatar = avatar
            perfil.save()

        return instance



class UserManagementSerializer(serializers.ModelSerializer):
    rol = serializers.ChoiceField(choices=Perfil.ROLES_CHOICES, write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'password', 'is_active', 'rol')

    def to_representation(self, instance):
        repr = super().to_representation(instance)
        try:
            repr['rol'] = instance.perfil.rol
        except Perfil.DoesNotExist:
            repr['rol'] = 'capturista'
        return repr

    def create(self, validated_data):
        rol = validated_data.pop('rol', 'capturista')
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        
        # El perfil se crea por la señal en models.py, lo actualizamos:
        perfil, created = Perfil.objects.get_or_create(user=user)
        perfil.rol = rol
        perfil.save()
        return user

    def update(self, instance, validated_data):
        rol = validated_data.pop('rol', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()

        if rol:
            perfil, created = Perfil.objects.get_or_create(user=instance)
            perfil.rol = rol
            perfil.save()

        return instance
