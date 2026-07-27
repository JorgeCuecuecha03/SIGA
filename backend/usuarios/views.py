from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UsuarioSerializer, ProfileUpdateSerializer

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def current_user(request):
    if request.method == 'PUT':
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Devolver los datos completos actualizados
            return Response(UsuarioSerializer(request.user).data)
        return Response(serializer.errors, status=400)
    
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)

from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import HistorialAccion
from .serializers import UserManagementSerializer, HistorialAccionSerializer
from .permissions import IsAdminGeneral

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated, IsAdminGeneral]

class HistorialAccionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialAccion.objects.all().select_related('user', 'user__perfil').order_by('-fecha')
    serializer_class = HistorialAccionSerializer
    permission_classes = [IsAuthenticated, IsAdminGeneral]
